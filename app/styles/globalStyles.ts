import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#1E90FF',
  background: '#FFFFFF',
  text: '#333333',
  lightGray: '#DDDDDD',
  danger: '#D32F2F',
  success: '#2E7D32',
  info: '#1976D2',
};

export const font = {
  regular: 'System',
  bold: 'System',
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.background,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    flex: 1,
    marginTop: 15,
  },

  iconButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },

  subHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginVertical: 10,
  },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#F8FAFF',
    color: colors.text,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },

  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  helpButtonText: {
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '500',
  },
});
