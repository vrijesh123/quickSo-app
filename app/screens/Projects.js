import React, { useEffect, useState } from 'react'
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { projectsAPI } from '../../apis/api'
import { commonStyles } from '../styles/styles'

const Projects = () => {
    const [data, setData] = useState([])

    const fetchData = async () => {
        try {
            const res = await projectsAPI.get('?populate=%2A')
            setData(res);

        } catch (error) {

        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    console.log('prrrrr', data)

    const Item = ({ title }) => {
        const handlePress = async () => {
            const supported = await Linking.canOpenURL(url);

            if (supported) {
                await Linking.openURL(url);
            } else {
                console.log(`Don't know how to open this URL: ${url}`);
            }
        };

        return (
            <View style={styles.item}>
                <Text style={styles.itemText}>{title}</Text>
                <TouchableOpacity onPress={handlePress}>
                    <Text style={styles.linkText}>View Details</Text>
                </TouchableOpacity>
            </View>
        )
    };

    return (
        <SafeAreaView style={commonStyles.container}>
            <Text style={commonStyles.title}>Projects</Text>
            <FlatList
                data={data?.data}
                renderItem={({ item }) => <Item key={item?.attributes?.id} title={item.attributes?.name} />}
                keyExtractor={item => item?.attributes?.id}
            />

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    item: {
        marginVertical: 5,
        paddingVertical: 10,
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        borderBottomWidth: 1,  // Set the width of the bottom border
        borderBottomColor: '#E7E8ED',  // Set the color of the bottom border
        justifyContent: 'space-between',
    },
    itemText: {
        color: "#000",
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    linkText: {
        color: '#2E4494',
        fontSize: 12,
        textDecorationLine: 'underline',
        fontFamily: 'Inter_400Regular',
        cursor: 'pointer',
    }
});

export default Projects