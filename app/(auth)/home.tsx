import React, { useEffect, useState } from 'react';  
import {   
  View,   
  Text,   
  StyleSheet,   
  TouchableOpacity,   
  ScrollView   
} from 'react-native';  
import { useRouter } from 'expo-router';  
import { MaterialIcons, Ionicons } from '@expo/vector-icons';  
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';  
import firestore from '@react-native-firebase/firestore';  

interface UserDetails {  
  firstName: string;  
  lastName: string;  
  email: string;  
  uid?: string;  
}  

interface AnalysisCount {  
  total: number;  
  recent: number;  
}  

export default function HomeScreen() {  
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);  
  const [analysisCount, setAnalysisCount] = useState<AnalysisCount>({  
    total: 0,  
    recent: 0  
  });  
  const [loading, setLoading] = useState(true);  
  const router = useRouter();  

  const fetchUserData = async (user: FirebaseAuthTypes.User) => {  
    try {  
      // Kullanıcı belgesini Firestore'dan çek  
      const userDoc = await firestore()  
        .collection('users')  
        .doc(user.uid)  
        .get();  
  
      if (userDoc.exists) {  
        const userData = userDoc.data() as UserDetails;  
        setUserDetails(userData);  
  
        // Kullanıcıya ait tahlil sonuçlarını çek  
        const analysisDoc = await firestore()  
          .collection('test_results')  
          .doc(user.uid)  // Kullanıcı UID'sine göre belgeyi çek  
          .get();  
  
        if (analysisDoc.exists) {  
          const analysisData = analysisDoc.data();  
          
          // Tahlil bilgilerini işleme  
          const totalAnalyses = analysisData?.results ? Object.keys(analysisData.results).length : 0;  
  
          // Son 30 gün içindeki tahlil sayısını hesapla  
          const thirtyDaysAgo = new Date();  
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);  
  
          const recentAnalyses = analysisData?.results ? Object.values(analysisData.results).filter(result => {  
            const analysisDate = new Date(analysisData.lastUpdated); // lastUpdated alanını kullan  
            return analysisDate >= thirtyDaysAgo;  
          }).length : 0;  
  
          setAnalysisCount({  
            total: totalAnalyses,  
            recent: recentAnalyses  
          });  
        } else {  
          console.log("No analysis document found for this user");  
        }  
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

  const handleSignOut = async () => {  
    try {  
      await auth().signOut();  
      router.replace('/');  
    } catch (error) {  
      console.error('Sign out error: ', error);  
    }  
  };  

  const navigateToAnalyses = () => {  
    router.push('/(auth)/testResultsScreen');  
  };  

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
      contentContainerStyle={styles.scrollContainer}  
    >  
      {/* Hoş Geldin Bölümü */}  
      <View style={styles.welcomeContainer}>  
        <Text style={styles.welcomeTitle}>  
          Merhaba, {userDetails.firstName} {userDetails.lastName} 👋  
        </Text>  
        <Text style={styles.welcomeSubtitle}>Sağlıklı günler dileriz</Text>  
      </View>  

      {/* Tahlil İstatistikleri */}  
      <View style={styles.statsContainer}>  
        <View style={styles.statCard}>  
          <View style={styles.statIconContainer}>  
            <MaterialIcons name="medical-services" size={30} color="#6a0dad" />  
          </View>  
          <View>  
            <Text style={styles.statTitle}>Toplam Tahlil</Text>  
            <Text style={styles.statValue}>{analysisCount.total}</Text>  
          </View>  
        </View>  

        <View style={styles.statCard}>  
          <View style={styles.statIconContainer}>  
            <Ionicons name="time" size={30} color="#6a0dad" />  
          </View>  
          <View>  
            <Text style={styles.statTitle}>Son 30 Gün Tahlil</Text>  
            <Text style={styles.statValue}>{analysisCount.recent}</Text>  
          </View>  
        </View>  
      </View>  

      {/* Hızlı İşlemler */}  
      <View style={styles.quickActionsContainer}>  
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>  
        
        <View style={styles.quickActionRow}>  
          <TouchableOpacity   
            style={styles.quickActionButton}  
            onPress={navigateToAnalyses}  
          >  
            <MaterialIcons name="list" size={24} color="#6a0dad" />  
            <Text style={styles.quickActionText}>Tahlillerimi Görüntüle</Text>  
          </TouchableOpacity>  

          <TouchableOpacity   
            style={styles.quickActionButton}  
            onPress={() => router.push('/(auth)/profile')}  
          >  
            <MaterialIcons name="person" size={24} color="#6a0dad" />  
            <Text style={styles.quickActionText}>Profilim</Text>  
          </TouchableOpacity>  
        </View>  
      </View>  

      {/* Çıkış Butonu */}  
      <TouchableOpacity   
        style={styles.logoutButton}   
        onPress={handleSignOut}  
      >  
        <MaterialIcons name="logout" size={24} color="white" />  
        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>  
      </TouchableOpacity>  
    </ScrollView>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#f5f5f5',  
  },  
  scrollContainer: {  
    flexGrow: 1,  
    padding: 20,  
  },  
  welcomeContainer: {  
    marginBottom: 20,  
  },  
  welcomeTitle: {  
    fontSize: 24,  
    fontWeight: 'bold',  
    color: '#6a0dad',  
  },  
  welcomeSubtitle: {  
    fontSize: 16,  
    color: 'gray',  
  },  
  statsContainer: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    marginBottom: 20,  
  },  
  statCard: {  
    backgroundColor: 'white',  
    flexDirection: 'row',  
    alignItems: 'center',  
    padding: 15,  
    borderRadius: 10,  
    width: '48%',  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  statIconContainer: {  
    marginRight: 15,  
    backgroundColor: '#f0e6f7',  
    padding: 10,  
    borderRadius: 10,  
  },  
  statTitle: {  
    fontSize: 10,  
    color: 'gray',  
  },  
  statValue: {  
    fontSize: 20,  
    fontWeight: 'bold',  
    color: '#6a0dad',  
  },  
  quickActionsContainer: {  
    marginBottom: 20,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: 'bold',  
    marginBottom: 10,  
    color: '#6a0dad',  
  },  
  quickActionRow: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
  },  
  quickActionButton: {  
    backgroundColor: 'white',  
    flexDirection: 'row',  
    alignItems: 'center',  
    justifyContent: 'center',  
    padding: 15,  
    borderRadius: 10,  
    width: '48%',  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  quickActionText: {  
    marginLeft: 10,  
    color: '#6a0dad',  
    fontWeight: 'bold',  
  },  
  logoutButton: {  
    flexDirection: 'row',  
    backgroundColor: '#6a0dad',  
    padding: 15,  
    borderRadius: 10,  
    alignItems: 'center',  
    justifyContent: 'center',  
  },  
  logoutButtonText: {  
    color: 'white',  
    fontWeight: 'bold',  
    marginLeft: 10,  
  },  
});