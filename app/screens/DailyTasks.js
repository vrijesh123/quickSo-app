import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Agenda } from 'react-native-calendars';
import moment from 'moment';
import { calendarAPI } from '../../apis/api';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import { commonStyles } from '../styles/styles';

const timeToString = (time) => {
  const date = new Date(time);
  return date.toISOString().split('T')[0];
};

const groupTasksByDate = (tasks) => {
  return tasks.reduce((groupedTasks, task) => {
    const date = task.date;
    if (!groupedTasks[date]) {
      groupedTasks[date] = [];
    }
    groupedTasks[date].push(task);
    return groupedTasks;
  }, {});
};

const DailyTasks = () => {
  const { width } = useWindowDimensions();
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [groupedTasks, setGroupedTasks] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await calendarAPI.get('?populate=%2A');
      const groupedTasks = groupTasksByDate(res);
      setGroupedTasks(groupedTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDayPress = useCallback((day) => {
    setSelectedDate(day.dateString);
  }, []);

  const renderEmptyDate = () => {
    return (
      <View style={styles.emptyDate}>
        <Text>This is empty date!</Text>
      </View>
    );
  };

  const renderItem = useCallback((item, firstItemInDay) => {
    return (
      <View
        style={{
          padding: 15,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5E5',
          marginTop: firstItemInDay ? 30 : 0,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#5f5f5f' }}>
          {item?.type}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#000' }}>
          {item?.name}
        </Text>
        <RenderHTML
          contentWidth={width}
          source={{ html: item?.description || '' }}
          baseStyle={{ fontSize: 14, fontWeight: '400', color: '#5f5f5f' }}
        />
      </View>
    );
  }, [width]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2E4494" />
      ) : (
        <>
          <Text style={commonStyles.title}>Daily Tasks</Text>

          <Text style={commonStyles.titleDate}>{moment(selectedDate).format('Do MMMM YYYY')}
          </Text>

          <Agenda
            current={selectedDate}
            selected={timeToString(Date.now())}
            onDayPress={handleDayPress}
            markedDates={{
              [selectedDate]: { selected: true, marked: true, selectedColor: '#CF6C58' },
            }}
            items={groupedTasks}
            renderItem={renderItem}
            renderEmptyDate={renderEmptyDate}
            showClosingKnob={true}
            showOnlySelectedDayItems={true}
            theme={agendaTheme}
          />
        </>
      )}
    </View>
  );
};

const agendaTheme = {
  selectedDayBackgroundColor: '#2E4494',
  todayTextColor: '#CF6C58',
  arrowColor: '#CF6C58',
  textSectionTitleColor: '#B6C1CD',
  dayTextColor: '#2D4150',
  selectedDayTextColor: '#ffffff',
  textDisabledColor: '#D9E1E8',
  dotColor: '#2E4494',
  selectedDotColor: '#ffffff',
  agendaTodayColor: '#2E4494',
  agendaKnobColor: '#2E4494',
  agendaDayTextColor: '#2D4150',
  agendaDayNumColor: '#2D4150',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  emptyDate: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDateText: {
    fontSize: 16,
    color: '#5f5f5f',
    fontStyle: 'italic',
  },
});

export default DailyTasks;
