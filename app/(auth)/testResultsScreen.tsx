import React, { useEffect, useState } from 'react';  
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';  
import firestore from '@react-native-firebase/firestore';  
import auth from '@react-native-firebase/auth';  
import { useRouter } from 'expo-router';  

interface TestResult {  
  id: string;  
  test_name: string;  
  test_date: string;  
  results: any; // Tahlil sonuçları  
}  

interface GroupedTestResult {  
  test_name: string;  
  test_date: string;  
  results: TestResult[];  
}  

export default function TestResultsScreen() {  
  const [testResults, setTestResults] = useState<GroupedTestResult[]>([]);  
  const [loading, setLoading] = useState(true);  
  const router = useRouter();  

  const fetchTestResults = async () => {  
    try {  
      const user = auth().currentUser; // Mevcut kullanıcıyı al  
      if (user) {  
        const doc = await firestore()  
          .collection('test_results')  
          .doc(user.uid) // Kullanıcı UID'sine göre belgeyi çek  
          .get();  

        if (doc.exists) {  
          const data = doc.data();  
          const resultsMap: { [key: string]: GroupedTestResult } = {};  

          // results nesnesini düzleştir  
          for (const [key, value] of Object.entries(data?.results)) {  
            (value as any[]).forEach((result: any) => {  
              if (!resultsMap[key]) {  
                resultsMap[key] = {  
                  test_name: key, // Anahtar adı (IgA, IgM)  
                  test_date: data?.lastUpdated, // Tahlil tarihi  
                  results: [],  
                };  
              }  
              resultsMap[key].results.push(result); // Sonuçları ekle  
            });  
          }  

          setTestResults(Object.values(resultsMap)); // Gruplandırılmış sonuçları ayarla  
        } else {  
          console.log("No test results found for this user");  
        }  
      }  
    } catch (error) {  
      console.error("Error fetching test results:", error);  
    } finally {  
      setLoading(false);  
    }  
  };  

  useEffect(() => {  
    fetchTestResults();  
  }, []);  

  const renderItem = ({ item }: { item: GroupedTestResult }) => (  
    <TouchableOpacity  
      style={styles.resultCard}  
      onPress={() => router.push(`/(auth)/testDetail?test_name=${item.test_name}&results=${JSON.stringify(item.results)}` as any)}  
    >  
      <Text style={styles.resultTitle}>{item.test_name || 'Tahlil Adı'}</Text>  
      <Text style={styles.resultDate}>{item.test_date || 'Tarih'}</Text>  
    </TouchableOpacity>  
  );  

  if (loading) {  
    return (  
      <View style={styles.container}>  
        <Text>Yükleniyor...</Text>  
      </View>  
    );  
  }  

  return (  
    <View style={styles.container}>  
      <Text style={styles.title}>Tahlil Sonuçlarım</Text>  
      <FlatList  
        data={testResults}  
        renderItem={renderItem}  
        keyExtractor={(item) => item.test_name}  
        contentContainerStyle={styles.listContainer}  
      />  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    padding: 20,  
    backgroundColor: '#f5f5f5',  
  },  
  title: {  
    fontSize: 24,  
    fontWeight: 'bold',  
    marginBottom: 20,  
    color: '#6a0dad',  
  },  
  listContainer: {  
    paddingBottom: 20,  
  },  
  resultCard: {  
    backgroundColor: 'white',  
    padding: 15,  
    borderRadius: 10,  
    marginBottom: 10,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  resultTitle: {  
    fontSize: 18,  
    fontWeight: 'bold',  
  },  
  resultDate: {  
    fontSize: 14,  
    color: 'gray',  
  },  
});