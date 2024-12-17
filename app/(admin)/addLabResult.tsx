import React, { useState, useEffect } from 'react';  
import {   
  View,   
  Text,   
  StyleSheet,   
  TextInput,   
  TouchableOpacity,   
  ScrollView,   
  Alert   
} from 'react-native';  
import SelectDropdown from 'react-native-select-dropdown';  
import firestore from '@react-native-firebase/firestore';  
import auth from '@react-native-firebase/auth';  
import { Feather } from '@expo/vector-icons';  
import uuid from 'react-native-uuid';  

// Tarih formatını düzenleyen yardımcı fonksiyon 
// ss 
const formatDate = (date: Date): string => {  
  const day = date.getDate().toString().padStart(2, '0');  
  const month = (date.getMonth() + 1).toString().padStart(2, '0');  
  const year = date.getFullYear();  
  const hours = date.getHours().toString().padStart(2, '0');  
  const minutes = date.getMinutes().toString().padStart(2, '0');  
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;  
};  

// Test türleri  
const TEST_TYPES = [  
  { value: 'IgA', label: 'IgA' },  
  { value: 'IgM', label: 'IgM' },  
  { value: 'IgG', label: 'IgG' },  
  { value: 'IgG1', label: 'IgG1' },  
  { value: 'IgG2', label: 'IgG2' },  
  { value: 'IgG3', label: 'IgG3' },  
  { value: 'IgG4', label: 'IgG4' }  
];  

interface TestValue {  
  id: string;  
  value: number;  
  unit: string;  
  test_date: string;
  age: string;
}  

interface TestResults {  
  [key: string]: TestValue[];  
}  

interface User {  
  id: string;  
  firstName: string;  
  lastName: string;  
  age?: string;
}  

export default function AddTestResultScreen() {  
  const [users, setUsers] = useState<User[]>([]);  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);  
  const [selectedTest, setSelectedTest] = useState('');  
  const [testValue, setTestValue] = useState('');  
  const [patientAge, setPatientAge] = useState('');  

  // Kullanıcıları getir  
  useEffect(() => {  
    const fetchUsers = async () => {  
      try {  
        const usersSnapshot = await firestore()  
          .collection('users')  
          .get();  

        const usersList = usersSnapshot.docs.map(doc => ({  
          id: doc.id,  
          ...doc.data()  
        } as User));  

        setUsers(usersList);  
      } catch (error) {  
        console.error('Kullanıcıları getirirken hata:', error);  
        Alert.alert('Hata', 'Kullanıcılar yüklenemedi');  
      }  
    };  

    fetchUsers();  
  }, []);  

  const handleAddTestResult = async () => {  
    // Validate input  
    if (!selectedUser) {  
      Alert.alert('Hata', 'Lütfen bir kullanıcı seçiniz');  
      return;  
    }  

    if (!selectedTest) {  
      Alert.alert('Hata', 'Lütfen tahlil türünü seçiniz');  
      return;  
    }  

    if (!testValue) {  
      Alert.alert('Hata', 'Lütfen test değerini giriniz');  
      return;  
    }  

    // Convert string to number, allowing decimal values  
    const numericValue = parseFloat(testValue.replace(',', '.'));  
    
    if (isNaN(numericValue)) {  
      Alert.alert('Hata', 'Geçerli bir sayı giriniz');  
      return;  
    }  

    try {  
      // Şu anki tarihi formatla  
      const currentDate = new Date();  
      const formattedTimestamp = formatDate(currentDate);  

      // Yeni test sonucu  
      const newTestValue: TestValue = {  
        id: uuid.v4().toString(), 
        value: numericValue,  
        unit: 'mg/dL',  
        test_date: formattedTimestamp,  
        age: selectedUser.age || '',
      };  

      // Kullanıcının test sonuçları dokümanını al  
      const testResultsRef = firestore()  
        .collection('test_results')  
        .doc(selectedUser.id);  

      const testResultsDoc = await testResultsRef.get();  

      if (testResultsDoc.exists) {  
        // Mevcut sonuçları güncelle  
        const currentData = testResultsDoc.data() as { results: TestResults };  
        const currentResults = currentData.results || {};  
        
        // Seçilen test türü için sonuçlar dizisi  
        const testTypeResults = currentResults[selectedTest] || [];  
        
        // Yeni sonucu diziye ekle  
        const updatedResults = {  
          ...currentResults,  
          [selectedTest]: [...testTypeResults, newTestValue]  
        };  

        // Dökümanı güncelle  
        await testResultsRef.update({  
          firstName: selectedUser.firstName,  
          lastName: selectedUser.lastName,  
          userId: selectedUser.id, 
          results: updatedResults,  
          lastUpdated: formattedTimestamp 
        });  
      } else {  
        // Yeni döküman oluştur  
        await testResultsRef.set({  
            firstName: selectedUser.firstName,  
            lastName: selectedUser.lastName,  
            userId: selectedUser.id,
          results: {  
            [selectedTest]: [newTestValue]  
          },  
          lastUpdated: formattedTimestamp  
        });  
      }  

      // Success alert  
      Alert.alert('Başarılı', `${selectedUser.firstName} ${selectedUser.lastName} için ${selectedTest} test sonucu başarıyla eklendi`);  
      
      // Reset form  
      setTestValue('');  
      setSelectedTest('');  
      setSelectedUser(null);  
      setPatientAge('');  
    } catch (error) {  
      console.error('Test sonucu eklenirken hata:', error);  
      Alert.alert('Hata', 'Test sonucu eklenemedi');  
    }  
  };

  return (  
    <ScrollView style={styles.container}>  
      <Text style={styles.title}>Tahlil Sonucu Ekle</Text>  
      
      {/* Kullanıcı Seçimi */}  
      <View style={styles.inputContainer}>  
        <Text style={styles.label}>Kullanıcı Seçiniz</Text>  
        <SelectDropdown  
          data={users}  
          onSelect={(selectedItem, index) => {  
            setSelectedUser(selectedItem);  
          }}  
          renderButton={(selectedItem, isOpened) => {  
            return (  
              <View style={styles.dropdownButtonStyle}>  
                <Text style={styles.dropdownButtonTxtStyle}>  
                  {selectedItem   
                    ? `${selectedItem.firstName} ${selectedItem.lastName}`   
                    : 'Kullanıcı Seçiniz'}  
                </Text>  
              </View>  
            );  
          }}  
          renderItem={(item, index, isSelected) => {  
            return (  
              <View style={{  
                ...styles.dropdownItemStyle,  
                ...(isSelected && { backgroundColor: '#D2D9DF' })  
              }}>  
                <Text style={styles.dropdownItemTxtStyle}>  
                  {item.firstName} {item.lastName}  
                </Text>  
              </View>  
            );  
          }}  
          showsVerticalScrollIndicator={false}  
          dropdownStyle={styles.dropdownMenuStyle}  
        />  
      </View>  
      {/* Tahlil Türü Seçimi */}  
      <View style={styles.inputContainer}>  
        <Text style={styles.label}>Tahlil Türü</Text>  
        <SelectDropdown  
          data={TEST_TYPES}  
          onSelect={(selectedItem, index) => {  
            setSelectedTest(selectedItem.value);  
          }}  
          renderButton={(selectedItem, isOpened) => {  
            return (  
              <View style={styles.dropdownButtonStyle}>  
                <Text style={styles.dropdownButtonTxtStyle}>  
                  {selectedItem ? selectedItem.label : 'Tahlil Türünü Seçiniz'}  
                </Text>  
              </View>  
            );  
          }}  
          renderItem={(item, index, isSelected) => {  
            return (  
              <View style={{  
                ...styles.dropdownItemStyle,  
                ...(isSelected && { backgroundColor: '#D2D9DF' })  
              }}>  
                <Text style={styles.dropdownItemTxtStyle}>  
                  {item.label}  
                </Text>  
              </View>  
            );  
          }}  
          showsVerticalScrollIndicator={false}  
          dropdownStyle={styles.dropdownMenuStyle}  
        />  
      </View>  

      {/* Test Değeri Girişi */}  
      <View style={styles.inputContainer}>  
        <Text style={styles.label}>Test Değeri (mg/dL)</Text>  
        <TextInput  
          style={styles.input}  
          value={testValue}  
          onChangeText={setTestValue}  
          keyboardType="decimal-pad"  
          placeholder="Örn: 120,5"  
          placeholderTextColor="#888"  
        />  
      </View>  

      <TouchableOpacity   
        style={styles.addButton}   
        onPress={handleAddTestResult}  
      >  
        <Feather name="plus-circle" size={24} color="white" />  
        <Text style={styles.addButtonText}>Tahlil Sonucunu Ekle</Text>  
      </TouchableOpacity>  
    </ScrollView>  
  );  
}  


const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#f5f5f5',  
    padding: 15,  
  },  
  title: {  
    fontSize: 24,  
    fontWeight: 'bold',  
    color: '#6a0dad',  
    textAlign: 'center',  
    marginBottom: 20,  
  },  
  inputContainer: {  
    marginBottom: 20,  
  },  
  label: {  
    fontSize: 16,  
    color: '#6a0dad',  
    marginBottom: 10,  
  },  
  dropdownButtonStyle: {  
    width: '100%',  
    height: 50,  
    backgroundColor: 'white',  
    borderRadius: 10,  
    borderWidth: 1,  
    borderColor: '#ddd',  
    justifyContent: 'center',  
    paddingHorizontal: 15,  
  },  
  dropdownButtonTxtStyle: {  
    fontSize: 16,  
    color: '#333',  
  },  
  dropdownItemStyle: {  
    width: '100%',  
    paddingHorizontal: 15,  
    
    paddingVertical: 10,  
  },  
  dropdownItemTxtStyle: {  
    fontSize: 16,  
    color: '#333',  
  },  
  dropdownMenuStyle: {  
    backgroundColor: 'white',  
    borderRadius: 10,  
  },  
  input: {  
    backgroundColor: 'white',  
    borderRadius: 10,  
    padding: 15,  
    fontSize: 16,  
    borderWidth: 1,  
    borderColor: '#ddd',  
  },  
  addButton: {  
    backgroundColor: '#6a0dad',  
    flexDirection: 'row',  
    justifyContent: 'center',  
    alignItems: 'center',  
    padding: 15,  
    borderRadius: 10,  
  },  
  addButtonText: {  
    color: 'white',  
    fontSize: 16,  
    fontWeight: 'bold',  
    marginLeft: 10,  
  }  
});