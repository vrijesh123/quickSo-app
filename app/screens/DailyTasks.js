import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { Agenda } from "react-native-calendars";
import moment from "moment";
import { calendarAPI, employeeAPI, tasksAPI } from "../../apis/api";
import RenderHTML from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import Modal from "react-native-modal";
import { Picker } from "@react-native-picker/picker";
import { commonStyles } from "../styles/styles";
import { useSelector } from "react-redux";
import qs from "qs";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

const timeToString = (time) => {
  const date = new Date(time);
  return date.toISOString().split("T")[0];
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
  const userData = useSelector((state) => state?.user); // Destructuring state for clarity
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [groupedTasks, setGroupedTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeee, setselectedEmployeee] = useState(null);

  const [tasks, setTasks] = useState([]);

  const [formState, setFormState] = useState({
    employee: "",
    date: moment(new Date()).format("YYYY-MM-DD"),
    attached_photo: null,
    details: "",
    uid: "",
    tasks: [],
    issues: [],
  });
  const [showPicker, setShowPicker] = useState(false);

  const onChange = (index, event, selectedDate) => {
    setShowPicker(false); // Close the picker after selecting a date
    if (selectedDate) {
      setSelectedDate(selectedDate);
      handleInputChange(
        selectedDate.toISOString().split("T")[0],
        index,
        "finished_date"
      );
    }
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

  const fetchData = async () => {
    try {
      // Fetch both API calls in parallel using Promise.all
      const [res, empRes] = await Promise.all([
        calendarAPI.get("?populate=%2A"),
        employeeAPI.get("?populate=%2A"),
      ]);

      // Process the responses
      const groupedTasks = groupTasksByDate(res);
      setGroupedTasks(groupedTasks);

      // Set employees data
      setEmployees(empRes);

      const currentEmployee = empRes?.data?.find(
        (emp) => emp.attributes.uid === userData.user.uid
      );

      if (currentEmployee) {
        setselectedEmployeee(currentEmployee);
      }
    } catch (error) {
      // More descriptive error handling
      console.error("Failed to fetch data:", error);
    } finally {
      // Ensure loading is set to false no matter what
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEmployeee?.id) {
      fetchTasks();
    }
  }, [selectedEmployeee]);

  const fetchTasks = async () => {
    try {
      // Define the query object
      const queryObject = {
        filters: {
          assignees: [selectedEmployeee?.id],
          status: {
            $ne: "Completed",
          },
          type: {
            $ne: "Task",
          },
        },
      };

      // Serialize the query object into a query string
      const queryString = qs.stringify(queryObject, { encodeValuesOnly: true });

      // Make the API call with the serialized query string
      const res = await tasksAPI.get(`?${queryString}`);

      // Update your state with the fetched tasks
      setTasks(res?.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const handleDayPress = useCallback((day) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleInputChange = (value, index, field) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleFormChange = (name, value) => {
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      handleFormChange("attached_photo", result.assets[0].uri);
    }
  };

  const renderEmptyDate = () => {
    return (
      <View style={styles.emptyDate}>
        <Text>This is empty date!</Text>
      </View>
    );
  };

  const renderItem = useCallback(
    (item, firstItemInDay) => {
      return (
        <View
          style={{
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E5E5",
            marginTop: firstItemInDay ? 30 : 0,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "500", color: "#5f5f5f" }}>
            {item?.type}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "500", color: "#000" }}>
            {item?.name}
          </Text>
          <RenderHTML
            contentWidth={width}
            source={{ html: item?.description || "" }}
            baseStyle={{ fontSize: 14, fontWeight: "400", color: "#5f5f5f" }}
          />
        </View>
      );
    },
    [width]
  );

  const handleSubmit = async () => {
    // Handle the form submission here
    try {
      // Submit formState to your API
      console.log("Form data:", formState);
      // Example: await calendarAPI.post('/reports', formState);
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setModalVisible(false);
    }
  };

  console.log("formmmmmm", tasks);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2E4494" />
      ) : (
        <>
          <View style={styles.heading}>
            <Text style={commonStyles.title}>Daily Tasks</Text>

            <Button
              title="Add Daily Report"
              onPress={() => setModalVisible(true)}
            />
          </View>

          <Text style={commonStyles.titleDate}>
            {moment(selectedDate).format("Do MMMM YYYY")}
          </Text>

          <Agenda
            current={selectedDate}
            selected={timeToString(Date.now())}
            onDayPress={handleDayPress}
            markedDates={{
              [selectedDate]: {
                selected: true,
                marked: true,
                selectedColor: "#CF6C58",
              },
            }}
            items={groupedTasks}
            renderItem={renderItem}
            renderEmptyDate={renderEmptyDate}
            showClosingKnob={true}
            showOnlySelectedDayItems={true}
            theme={agendaTheme}
          />

          <Modal
            isVisible={isModalVisible}
            onBackdropPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Add Daily Report</Text>

                {/* <Picker
                  selectedValue={selectedEmployeee?.id}
                  style={styles.picker}
                  editable={false}
                >
                  {employees?.data?.map((employee) => (
                    <Picker.Item
                      key={employee.id}
                      label={`${employee.attributes.first_name} ${employee.attributes.last_name}`}
                      value={employee.id}
                    />
                  ))}
                </Picker> */}

                <Text style={styles.label}>Employee</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Employee"
                  value={`${selectedEmployeee?.attributes?.first_name} ${selectedEmployeee?.attributes?.last_name}`}
                  editable={false}
                />

                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Date"
                  value={formState.date}
                  editable={false} // Make the input field non-editable
                />

                <View>
                  <Button title="Choose File" onPress={pickImage} />
                  {formState?.attached_photo && (
                    <Image
                      source={{ uri: formState?.attached_photo }}
                      style={styles.image}
                    />
                  )}
                </View>

                <ScrollView horizontal>
                  <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.idCell}>ID</Text>
                      <Text style={styles.headerCell}>Task</Text>
                      <Text style={styles.headerCell}>Start Date</Text>
                      <Text style={styles.headerCell}>Estimated Date</Text>
                      <Text style={styles.headerCell}>Finished Date</Text>
                      <Text style={styles.headerCell}>
                        Percentage of Completion
                      </Text>
                      <Text style={styles.headerCell}>Completed?</Text>
                      <Text style={styles.headerCell}>Notes</Text>
                    </View>

                    {tasks?.map((task, index) => (
                      <View key={task.id} style={styles.tableRow}>
                        <Text style={styles.smallCell}>{task.id}</Text>
                        <Text style={styles.cell}>
                          {task?.attributes?.name}
                        </Text>
                        <Text style={styles.cell}>
                          {task?.attributes?.start_date}
                        </Text>
                        <Text style={styles.cell}>
                          {task?.attributes?.end_date}
                        </Text>
                        {/* Button to trigger DatePicker */}
                        <View style={styles.cell}>
                          <Button
                            onPress={showDatePicker}
                            title={selectedDate ? selectedDate?.toString() : ""}
                          />
                        </View>

                        {/* Show DateTimePicker when triggered */}
                        {showPicker && (
                          <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="default"
                            onChange={(e) => onChange(index, e, e.target.value)}
                          />
                        )}
                        <TextInput
                          style={styles.cell}
                          placeholder="0"
                          value={task.completionPercentage}
                          onChangeText={(value) =>
                            handleInputChange(
                              value,
                              index,
                              "completion_percentage"
                            )
                          }
                          keyboardType="numeric"
                        />
                        <Picker
                          selectedValue={task.completed}
                          style={styles.cell}
                          onValueChange={(value) =>
                            handleInputChange(value, index, "completed")
                          }
                        >
                          <Picker.Item label="No" value="No" />
                          <Picker.Item label="Yes" value="Yes" />
                        </Picker>
                        <TextInput
                          style={styles.cell}
                          placeholder="Enter notes"
                          value={task.notes}
                          onChangeText={(value) =>
                            handleInputChange(value, index, "notes")
                          }
                        />
                      </View>
                    ))}
                  </View>
                </ScrollView>

                <TextInput
                  style={styles.input}
                  placeholder="Unique ID"
                  value={formState.uid}
                  onChangeText={(text) => handleFormChange("uid", text)}
                />

                {/* Add more form fields for tasks and issues as needed */}

                <Button title="Submit Report" onPress={handleSubmit} />
              </ScrollView>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const agendaTheme = {
  selectedDayBackgroundColor: "#2E4494",
  todayTextColor: "#CF6C58",
  arrowColor: "#CF6C58",
  textSectionTitleColor: "#B6C1CD",
  dayTextColor: "#2D4150",
  selectedDayTextColor: "#ffffff",
  textDisabledColor: "#D9E1E8",
  dotColor: "#2E4494",
  selectedDotColor: "#ffffff",
  agendaTodayColor: "#2E4494",
  agendaKnobColor: "#2E4494",
  agendaDayTextColor: "#2D4150",
  agendaDayNumColor: "#2D4150",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  emptyDate: {
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyDateText: {
    fontSize: 16,
    color: "#5f5f5f",
    fontStyle: "italic",
  },
  heading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 20,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    color: "#5f5f5f",
    paddingLeft: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  tableContainer: {
    flexDirection: "column",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerCell: {
    padding: 10,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    width: 150,
  },
  idCell: {
    padding: 10,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    width: 80,
  },
  cell: {
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    width: 150,
  },
  smallCell: {
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    width: 80,
  },
});

export default DailyTasks;
