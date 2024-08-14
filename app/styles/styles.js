import { StatusBar, StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    fontWeight: '500',
    color: '#CF6C58',
    marginBottom: 10
  },
  titleDate: {
    fontSize: 24,
    fontFamily: 'Inter_400Regular',
    color: '#000',
  },
});