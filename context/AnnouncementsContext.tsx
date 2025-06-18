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
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

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

  // Fetch read announcement IDs for authenticated user
  useEffect(() => {
    if (!uid) {
      setReadIds([]); // Clear readIds if no user is logged in
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
    if (!uid || readIds.includes(id)) return; // Skip if not logged in or already read
    set(ref(db, `users/${uid}/readAnnouncements/${id}`), true);
    setReadIds((prev) => [...prev, id]); // Optimistic update
  };

  const unreadCount = announcements.filter((a) => !readIds.includes(a.id)).length;

  return (
    <AnnouncementsContext.Provider value={{ announcements, readIds, markAsRead, unreadCount }}>
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