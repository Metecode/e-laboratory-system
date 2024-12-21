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

      if (userDoc.exists) {
        // Type assertion to ensure data matches UserDetails interface  
        const userData = userDoc.data() as UserDetails;
        setUserDetails({
          ...userData,
          firstName: user.displayName || userData.firstName // Prioritize displayName from Auth  
        });
        setPatientCount(patientsSnapshot.size);
      } else {
        console.log("No user document found in Firestore");
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
    // Navigate to the AddTestResult screen  
    router.push('/(admin)/addLabResult');  // Assumes you'll create this route  
  }; 

  const navigateToAddGuidelineScreen = () => {  
    // Navigate to the AddTestResult screen  
    // router.push('/(admin)/addGuidelineScreen');  // Assumes you'll create this route  
  }; 

  const dashboardItems = [
    {
      icon: <MaterialIcons name="people" size={24} color="#6a0dad" />,
      title: 'Toplam Hasta',
      count: patientCount
    },
    {
      icon: <MaterialIcons name="science" size={24} color="#6a0dad" />,
      title: 'Bekleyen Testler',
      count: 25
    },
    {
      icon: <Feather name="check-circle" size={24} color="#6a0dad" />,
      title: 'Tamamlanan Testler',
      count: 125
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
      <Text style={styles.title}>Merhaba {userDetails?.firstName} 🙏</Text>
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
            <Feather name="plus-circle" size={24} color="#6a0dad" />
            <Text style={styles.quickActionText}>Yeni Hasta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={navigateToAddTestResult}  >
            <MaterialIcons name="add-task" size={24} color="#6a0dad" />
            <Text style={styles.quickActionText}>Tahlil Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={navigateToAddTestResult}  >
            <MaterialIcons name="add-task" size={24} color="#6a0dad" />
            <Text style={styles.quickActionText}>Kılavuz Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.container}>
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
      </View>
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