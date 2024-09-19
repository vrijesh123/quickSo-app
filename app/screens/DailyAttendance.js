import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { Agenda } from 'react-native-calendars';
import { commonStyles } from '../styles/styles';
import { attendanceAPI } from '../../apis/api';
import { timeToString } from '../utils';
import moment from 'moment';

const DailyAttendance = ({ route }) => {
    const { project } = route.params;
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await attendanceAPI.get('?populate=%2A');
            const attendance_data = res?.data?.filter(
                data => data?.attributes?.location?.data?.id === project?.location?.data?.id
            );

            // Transform the data to match the format expected by the Agenda component
            const formattedData = attendance_data.reduce((acc, curr) => {
                const date = curr.attributes.date;
                if (!acc[date]) {
                    acc[date] = [];
                }
                acc[date].push({
                    name: curr.attributes?.employee?.data?.attributes?.first_name,
                    date: curr.attributes?.date,
                    in_time: curr.attributes.in_time,
                    out_time: curr.attributes.out_time,
                    location: project?.location?.data?.attributes?.name,
                    description: curr.attributes.description,
                });
                return acc;
            }, {});

            setData(formattedData);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            setLoading(false);
        }
    }, [project?.location?.data?.id]);

    const handleDayPress = useCallback(day => {
        setSelectedDate(day.dateString);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderEmptyDate = () => {
        return (
            <View style={styles.emptyDate}>
                <Text>No attendance records for this date.</Text>
            </View>
        );
    };

    const renderItem = useCallback((item, firstItemInDay) => {
        const inTime = item?.in_time ? item.in_time.split('.')[0] : null;
        const outTime = item?.out_time ? item.out_time.split('.')[0] : null;

        return (
            <View
                style={{
                    padding: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E5E5',
                    marginTop: firstItemInDay ? 30 : 0,
                    backgroundColor: '#FFFF',
                    marginRight: 10,
                    marginBottom: 5,
                }}
            >
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#5f5f5f' }}>
                    {item?.name}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#000', marginBottom: 5 }}>
                    {item?.location}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#5f5f5f' }}>
                    Check in -{' '}
                    <Text style={{ color: '#CF6C58' }}>
                        {inTime ? moment(inTime, 'HH:mm:ss').format('hh:mm A') : 'N/A'}
                    </Text>
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#5f5f5f' }}>
                    Check out -{' '}
                    <Text style={{ color: '#CF6C58' }}>
                        {outTime ? moment(outTime, 'HH:mm:ss').format('hh:mm A') : 'N/A'}
                    </Text>
                </Text>
            </View>
        );
    }, []);

    const loadItemsForMonth = useCallback(day => {
        const newItems = {};
        for (let i = -15; i < 85; i++) {
            const time = day.timestamp + i * 24 * 60 * 60 * 1000;
            const strTime = moment(time).format('YYYY-MM-DD');

            if (!data[strTime]) {
                newItems[strTime] = [];
            } else {
                newItems[strTime] = data[strTime];
            }
        }
        setData(prevData => ({ ...prevData, ...newItems }));
    }, [data]);

    if (loading) {
        return (
            <SafeAreaView style={commonStyles.container}>
                <Text style={commonStyles.title}>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={commonStyles.container}>
            <Text style={commonStyles.title}>Daily Attendance</Text>
            <Text style={commonStyles.titleDate}>
                {moment(selectedDate).format('Do MMMM YYYY')}
            </Text>
            <Agenda
                items={data}
                renderItem={renderItem}
                selected={selectedDate}
                onDayPress={handleDayPress}
                showTodayButton
                showClosingKnob={true}
                showOnlySelectedDayItems={true}
                renderEmptyDate={renderEmptyDate}
                theme={agendaTheme}
                sectionStyle={styles.section}
                loadItemsForMonth={loadItemsForMonth}
            />
        </SafeAreaView>
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
    item: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 5,
        marginVertical: 10,
        marginHorizontal: 20,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    section: {
        backgroundColor: 'blue',
        padding: 30,
    },
    emptyDate: {
        padding: 15,
        marginTop: 30,
        backgroundColor: '#FFFF',
        marginRight: 10,
        marginBottom: 5,
    },
    header: {
        marginBottom: 10,
    },
    dateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    columnHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    columnData: {
        fontSize: 16,
        flex: 1,
        textAlign: 'center',
        color: '#333',
    },
});

export default DailyAttendance;
