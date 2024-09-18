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
  TouchableOpacity,
} from "react-native";
import { Agenda } from "react-native-calendars";
import moment from "moment";
import {
  calendarAPI,
  dailyReportAPI,
  employeeAPI,
  tasksAPI,
} from "../../apis/api";
import RenderHTML from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import Modal from "react-native-modal";
import { Picker } from "@react-native-picker/picker";
import { commonStyles } from "../styles/styles";
import { useSelector } from "react-redux";
import qs from "qs";
import { v4 as uuidv4 } from "uuid";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import DeleteIcon from "../assets/DeleteIcon";
import AntDesign from "@expo/vector-icons/AntDesign";
import Toast from "react-native-toast-message";

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
  const [items, setItems] = useState([]);

  // Function to add new item
  const addItem = () => {
    const newItem = {
      id: uuidv4(),
      issue: "",
      risk: "",
      mitigation: "",
      notes: "",
    };
    setItems([...items, newItem]);
  };

  // Function to delete an item
  const deleteItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Function to update an item
  const updateItem = (id, field, value) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

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

    console.log("closeddddd", selectedDate, index);
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
    //   {
    //     "employee": 28,
    //     "date": "2024-09-06T06:29:43.284Z",
    //     "attached_photo": null,
    //     "details": "<p>dsd dsvdsc</p>",
    //     "uid": "4f40c636-4062-4b87-86d1-14d651e7f536",
    //     "tasks": [
    //         {
    //             "id": 25,
    //             "finished_date": "2025-03-19T18:30:00.000Z",
    //             "completion_percentage": 20,
    //             "completed": "No",
    //             "notes": "cewmc kdvew"
    //         }
    //     ],
    //     "issues": [
    //         {
    //             "id": "8b1de561-3b59-41eb-95a8-acf112461181",
    //             "issue": "fcewvcew",
    //             "risk": "fwdfewf",
    //             "mitigation": "fdfdwfew",
    //             "notes": "cdscdsfd"
    //         }
    //     ]
    // }

    const daily_tasks = tasks?.map((task) => ({
      id: task?.id,
      finished_date: task?.finished_date ?? new Date(),
      completion_percentage: task?.completion_percentage ?? 0,
      completed: task?.completed ?? "No",
      notes: task?.notes ?? "",
    }));
    try {
      // Submit formState to your API
      const data = {
        employee: selectedEmployeee?.id,
        date: formState?.date,
        attached_photo: formState?.attached_photo,
        details: formState?.details,
        tasks: daily_tasks,
        issues: items,
        uid: uuidv4(),
      };
      console.log("Daily Report Form data:", data);

      const res = await dailyReportAPI.post("", { data });

      if (res?.data) {
        Toast.show({
          type: "success",
          text1: "Daily Report Submitted",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Failed to submit report:", error);

      Toast.show({
        type: "error",
        text1: "Something Went Wrong",
        text2: { error },
        position: "bottom",
      });
    } finally {
      setModalVisible(false);
    }
  };

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
                            title={
                              selectedDate
                                ? moment(selectedDate).format("DD-MM-YYYY")
                                : ""
                            }
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

                {/* Add more form fields for tasks and issues as needed */}

                <View style={styles.heading}>
                  <Text style={styles.flex1}>
                    Project Risks, Issues, and Mitigation Plans
                  </Text>
                  <View style={styles.flex1}>
                    <Button title="New Item" onPress={addItem} />
                  </View>
                </View>

                <ScrollView horizontal>
                  <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.idCell}>No</Text>
                      <Text style={styles.headerCell}>Project Issue</Text>
                      <Text style={styles.headerCell}>Risk</Text>
                      <Text style={styles.headerCell}>Mitigation</Text>
                      <Text style={styles.headerCell}>Notes</Text>
                      <Text style={styles.headerCell}>Actions</Text>
                    </View>

                    {items?.map((item, index) => (
                      <View key={index} style={styles.tableRow}>
                        <Text style={styles.smallCell}>{index + 1}</Text>
                        <TextInput
                          style={styles.cell}
                          placeholder="Enter project issue"
                          value={item.issue}
                          onChangeText={(text) =>
                            updateItem(item.id, "issue", text)
                          }
                        />
                        <TextInput
                          style={styles.cell}
                          placeholder="Enter risk"
                          value={item.risk}
                          onChangeText={(text) =>
                            updateItem(item.id, "risk", text)
                          }
                        />
                        <TextInput
                          style={styles.cell}
                          placeholder="Enter mitigation"
                          value={item.mitigation}
                          onChangeText={(text) =>
                            updateItem(item.id, "mitigation", text)
                          }
                        />
                        <TextInput
                          style={styles.cell}
                          placeholder="Enter notes"
                          value={item.notes}
                          onChangeText={(text) =>
                            updateItem(item.id, "notes", text)
                          }
                        />
                        <TouchableOpacity
                          onPress={() => deleteItem(item.id)}
                          style={{ padding: 10 }}
                        >
                          <AntDesign
                            style={styles.deleteButton}
                            name="delete"
                            size={20}
                            color="white"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>

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
  flex1: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 5,
    borderRadius: 3,
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
    gap: 20,
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
