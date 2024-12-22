import React, { useEffect, useState, useCallback } from 'react';  
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';  
import { Feather, MaterialIcons } from '@expo/vector-icons';  
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';  
import firestore from '@react-native-firebase/firestore';  
import { useRouter, useFocusEffect } from 'expo-router';  

interface UserDetails {  
  firstName: string;  
  email: string;  
  photo?: string;  
}  

export default function HomeScreen() {  
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);  
  const [patientCount, setPatientCount] = useState(0);  
  const [guidelineCount, setGuidelineCount] = useState(0);  
  const [completedTestCount, setCompletedTestCount] = useState(0); // New state for completed test count  
  const [loading, setLoading] = useState(true);  
  const [refreshing, setRefreshing] = useState(false);  
  const router = useRouter();  

  const fetchUserData = async (user: FirebaseAuthTypes.User) => {  
    try {  
      // Fetch user document from Firestore  
      const userDoc = await firestore()  
        .collection('admin')  
        .doc(user.uid)  
        .get();  

      const patientsSnapshot = await firestore()  
        .collection('users')  
        .get();  

      // Fetch guidelines count  
      const guidelinesSnapshot = await firestore()  
        .collection('guidelines')  
        .get();  

      const totalGuidelines = guidelinesSnapshot.docs.reduce((count, doc) => {  
        const guidelines = doc.data().guidelines || [];  
        return count + guidelines.length; // Count guidelines in each category  
      }, 0);  

      // Fetch completed tests count  
      const completedTestsSnapshot = await firestore()  
        .collection('test_results') // Assuming each test result has a userId field  
        .get();  

      let totalCompletedTests = 0;  

      // Iterate through each test result document to count tests in results  
      completedTestsSnapshot.forEach(doc => {  
        const data = doc.data();  
        if (data.results) {  
          totalCompletedTests += Object.keys(data.results).length; // Count the number of tests in results  
        }  
      });  

      if (userDoc.exists) {  
        const userData = userDoc.data() as UserDetails;  
        setUserDetails({  
          ...userData,  
          firstName: user.displayName || userData.firstName // Prioritize displayName from Auth  
        });  
        setPatientCount(patientsSnapshot.size);  
        setGuidelineCount(totalGuidelines);  
        setCompletedTestCount(totalCompletedTests); // Set the total completed tests count  
      } else {  
        // console.log("No user document found in Firestore");  
      }  
    } catch (error) {  
      console.error("Error fetching user data:", error);  
    } finally {  
      setLoading(false);  
      setRefreshing(false);  
    }  
  };  

  // Listener for authentication state  
  useEffect(() => {  
    const unsubscribe = auth().onAuthStateChanged((user) => {  
      if (user) {  
        fetchUserData(user);  
      } else {  
        router.replace('/');  
        setLoading(false);  
      }  
    });  

    return () => unsubscribe();  
  }, []);  

  // Use useFocusEffect to refresh data when screen comes into focus  
  useFocusEffect(  
    useCallback(() => {  
      const user = auth().currentUser;  
      if (user) {  
        fetchUserData(user);  
      }  
    }, [])  
  );  

  // Pull to refresh functionality  
  const onRefresh = useCallback(() => {  
    setRefreshing(true);  
    const user = auth().currentUser;  
    if (user) {  
      fetchUserData(user);  
    }  
  }, []);  

  const navigateToAddTestResult = () => {  
    router.push('/(admin)/addLabResult');  
  };   

  const navigateToAddGuidelineScreen = () => {  
    router.push('/(admin)/addGuidelineScreen');  
  };   

  const dashboardItems = [  
    {  
      icon: <MaterialIcons name="people" size={24} color="#6a0dad" />,  
      title: 'Toplam Hasta',  
      count: patientCount  
    },  
    {  
      icon: <MaterialIcons name="assignment" size={24} color="#6a0dad" />, // Changed icon  
      title: 'Kılavuz Sayısı', // Updated title  
      count: guidelineCount // Use guideline count  
    },  
    {  
      icon: <Feather name="check-circle" size={24} color="#6a0dad" />,  
      title: 'Tamamlanan Tahliller', // Updated title  
      count: completedTestCount // Use completed test count  
    }  
  ];  

  if (loading) {  
    return (  
      <View style={styles.container}>  
        <Text>Yükleniyor...</Text>  
      </View>  
    );  
  }  

  if (!userDetails) {  
    return (  
      <View style={styles.container}>  
        <Text>Kullanıcı bilgileri bulunamadı</Text>  
      </View>  
    );  
  }  
  
  return (  
    <ScrollView  
      style={styles.container}  
      refreshControl={  
        <RefreshControl  
          refreshing={refreshing}  
          onRefresh={onRefresh}  
          colors={['#6a0dad']}  
        />  
      }  
    >  
      <Text style={styles.title}>Merhaba Dr. {userDetails?.firstName} 🙏</Text>  
      <View style={styles.dashboardGrid}>  
        {dashboardItems.map((item, index) => (  
          <TouchableOpacity key={index} style={styles.dashboardItem}>  
            {item.icon}  
            <Text style={styles.itemTitle}>{item.title}</Text>  
            <Text style={styles.itemCount}>{item.count}</Text>  
          </TouchableOpacity>  
        ))}  
      </View>  

      <View style={styles.quickActionsContainer}>  
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>  
        <View style={styles.quickActions}>  
          <TouchableOpacity style={styles.quickActionButton}>  
            <MaterialIcons name="person-add" size={24} color="#6a0dad" />  
            <Text style={styles.quickActionText}>Yeni Hasta</Text>  
          </TouchableOpacity>  
          <TouchableOpacity style={styles.quickActionButton} onPress={navigateToAddTestResult}  >  
            <MaterialIcons name="add-task" size={24} color="#6a0dad" />  
            <Text style={styles.quickActionText}>Tahlil Ekle</Text>  
          </TouchableOpacity>  
          <TouchableOpacity style={styles.quickActionButton} onPress={navigateToAddGuidelineScreen}  >  
            <MaterialIcons name="add-chart" size={24} color="#6a0dad" />  
            <Text style={styles.quickActionText}>Kılavuz Ekle</Text>  
          </TouchableOpacity>  
        </View>  
      </View>  
      {/* <View style={styles.container}>  
        <View style={styles.detailsContainer}>  
          {userDetails?.photo && (  
            <Image  
              source={{ uri: userDetails.photo }}  
              style={styles.profileImage}  
            />  
          )}  
          <Text>Email: {userDetails?.email}</Text>  
          <Text>First Name: {userDetails?.firstName}</Text>  
        </View>  
      </View>   */}
    </ScrollView>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#f5f5f5',  
    padding: 15,  
  },  
  profileImage: {  
    width: 150,  
    height: 150,  
    borderRadius: 75,  
    marginBottom: 20,  
  },  
  detailsContainer: {  
    alignItems: 'center',  
    marginBottom: 20,  
  },  
  title: {  
    fontSize: 24,  
    fontWeight: 'bold',  
    color: '#6a0dad',  
    textAlign: 'center',  
    marginBottom: 20,  
  },  
  dashboardGrid: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    marginBottom: 20,  
  },  
  dashboardItem: {  
    backgroundColor: 'white',  
    width: '30%',  
    padding: 15,  
    borderRadius: 10,  
    alignItems: 'center',  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  itemTitle: {  
    marginTop: 10,  
    fontSize: 12,  
    color: 'gray',  
  },  
  itemCount: {  
    fontSize: 18,  
    fontWeight: 'bold',  
    color: '#6a0dad',  
  },  
  quickActionsContainer: {  
    backgroundColor: 'white',  
    borderRadius: 10,  
    padding: 15,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: 'bold',  
    color: '#6a0dad',  
    marginBottom: 15,  
  },  
  quickActions: {  
    flexDirection: 'row',  
    justifyContent: 'space-around',  
  },  
  quickActionButton: {  
    alignItems: 'center',  
    padding: 10,  
  },  
  quickActionText: {  
    marginTop: 5,  
    fontSize: 12,  
    color: '#6a0dad',  
  }  
});