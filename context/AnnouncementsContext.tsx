import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onValue, ref, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebaseConfig';

type Announcement = {
  id: string;
  text: string;
  timestamp?: string;
};

type AnnouncementsContextType = {
  announcements: Announcement[];
  readIds: string[];
  markAsRead: (id: string) => void;
  unreadCount: number;
};

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

export const AnnouncementsProvider = ({ children }: { children: ReactNode }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [userCreationTime, setUserCreationTime] = useState<Date | null>(null);
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  // Get user creation time
  useEffect(() => {
    if (auth.currentUser?.metadata.creationTime) {
      setUserCreationTime(new Date(auth.currentUser.metadata.creationTime));
    }
  }, [auth.currentUser]);

  // Fetch announcements
  useEffect(() => {
    const announcementsRef = ref(db, 'announcements');
    const unsubscribe = onValue(announcementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed: Announcement[] = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Announcement, 'id'>),
        }));
        setAnnouncements(parsed.reverse());
      } else {
        setAnnouncements([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch read announcement IDs
  useEffect(() => {
    if (!uid) {
      setReadIds([]);
      return;
    }

    const readAnnouncementsRef = ref(db, `users/${uid}/readAnnouncements`);
    const unsubscribe = onValue(readAnnouncementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setReadIds(Object.keys(data));
      } else {
        setReadIds([]);
      }
    });

    return () => unsubscribe();
  }, [uid]);

  const markAsRead = (id: string) => {
    if (!uid || readIds.includes(id)) return;
    set(ref(db, `users/${uid}/readAnnouncements/${id}`), true);
    setReadIds((prev) => [...prev, id]);
  };

  // Filter announcements to only those made after user creation time
  const filteredAnnouncements = announcements.filter((a) => {
    if (!userCreationTime || !a.timestamp) return false; // block until loaded
    const announcementTime = new Date(a.timestamp);
    return announcementTime >= userCreationTime;
  });

  const unreadCount = filteredAnnouncements.filter((a) => !readIds.includes(a.id)).length;

  return (
    <AnnouncementsContext.Provider value={{ announcements: filteredAnnouncements, readIds, markAsRead, unreadCount }}>
      {children}
    </AnnouncementsContext.Provider>
  );
};

export const useAnnouncements = () => {
  const context = useContext(AnnouncementsContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementsProvider');
  }
  return context;
};
