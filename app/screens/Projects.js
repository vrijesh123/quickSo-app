import React, { useEffect, useState, useCallback } from 'react';
import { Button, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { projectsAPI } from '../../apis/api';
import { commonStyles } from '../styles/styles';
import { useSelector } from 'react-redux';
import { clearStorage } from '../utils';

const Projects = () => {
    const userData = useSelector((state) => state?.user); // Destructuring state for clarity

    const [data, setData] = useState([]);

    const fetchData = useCallback(async () => {
        try {
            const res = await projectsAPI.get('?populate=%2A');
            setData(res?.data || []); // Handling possible undefined values
        } catch (error) {
            console.error('Failed to fetch projects:', error); // Better error handling
        }
    }, []); // Empty dependency array since there are no external dependencies

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const renderItem = ({ item }) => {
        const { name } = item.attributes;
        const handlePress = async () => {
            const url = `https://example.com/project/${item.id}`;
            try {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                } else {
                    console.warn(`Cannot open URL: ${url}`);
                }
            } catch (error) {
                console.error('Failed to open URL:', error);
            }
        };

        return (
            <View style={styles.item}>
                <Text style={styles.itemText}>{name}</Text>
                <TouchableOpacity onPress={handlePress}>
                    <Text style={styles.linkText}>View Details</Text>
                </TouchableOpacity>
            </View>
        );
    };

    console.log('projects', data)

    return (
        <SafeAreaView style={commonStyles.container}>
            <View style={styles.name}>
                <Text style={styles.userTitle}>
                    Welcome, <Text style={styles.username}>{userData?.user?.username}</Text>
                </Text>
            </View>
            <Text style={commonStyles.title}>Projects</Text>
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item?.id.toString()} // Ensure key is a string
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    name: {
        borderBottomWidth: 1,
        borderBlockColor: '#E7E8ED',
        marginBottom: 30

    },
    userTitle: {
        fontSize: 20,
        marginBottom: 10,
        fontFamily: 'Inter_400Medium',
        textTransform: 'capitalize'
    },
    username: {
        fontWeight: 'bold',  // This will make the username bold
    },
    item: {
        marginVertical: 5,
        paddingVertical: 10,
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E7E8ED',
        justifyContent: 'space-between',
    },
    itemText: {
        color: '#000',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    linkText: {
        color: '#2E4494',
        fontSize: 12,
        textDecorationLine: 'underline',
        fontFamily: 'Inter_400Regular',
    },
    listContent: {
        paddingBottom: 20, // Adding some padding at the bottom
    },
});

export default Projects;
