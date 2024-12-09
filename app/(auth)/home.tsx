import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface UserDetails {
  firstName: string;
  email: string;
  uid?: string;
}

export default function HomeScreen() {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserData = async (user: FirebaseAuthTypes.User) => {
    try {
      // Fetch user document from Firestore
      const userDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();

      if (userDoc.exists) {
        // Type assertion to ensure data matches UserDetails interface
        const userData = userDoc.data() as UserDetails;
        setUserDetails(userData);
      } else {
        console.log("No user document found in Firestore");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up authentication state listener
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        // If user is authenticated, fetch their details
        fetchUserData(user);
      } else {
        // If no user is logged in, redirect to login
        router.replace('/');
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth().signOut();
      router.replace('/');
    } catch (error) {
      console.error('Sign out error: ', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={styles.container}>
        <Text>No user data found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* {userDetails.photo && (
        <Image
          source={{ uri: userDetails.photo }}
          style={styles.profileImage}
        />
      )} */}
      <Text style={styles.title}>Welcome {userDetails.firstName} 🙏</Text>
      <View style={styles.detailsContainer}>
        <Text>Email: {userDetails.email}</Text>
        <Text>First Name: {userDetails.firstName}</Text>
      </View>
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleSignOut}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});