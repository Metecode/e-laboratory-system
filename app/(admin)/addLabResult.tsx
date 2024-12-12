import React, { useState } from 'react';  
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

// Define the test types as a constant  
const TEST_TYPES = [  
  { value: 'IgG1', label: 'IgG1' },  
  { value: 'IgG2', label: 'IgG2' },  
  { value: 'IgG3', label: 'IgG3' },  
  { value: 'IgG4', label: 'IgG4' },  
  { value: 'IgA', label: 'IgA' },  
  { value: 'IgM', label: 'IgM' },  
  { value: 'IgG', label: 'IgG' }  
];  

// Interface for test result  
interface TestResult {  
  type: string;  
  value: number;  
  timestamp: Date;  
  userId: string;  
}  

export default function AddTestResultScreen() {  
  const [selectedTest, setSelectedTest] = useState('');  
  const [testValue, setTestValue] = useState('');  

  const handleAddTestResult = async () => {  
    // Validate input  
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
      // Get current user  
      const currentUser = auth().currentUser;  
      if (!currentUser) {  
        Alert.alert('Hata', 'Kullanıcı oturumu açık değil');  
        return;  
      }  

      // Prepare test result object  
      const testResult: TestResult = {  
        type: selectedTest,  
        value: numericValue,  
        timestamp: new Date(),  
        userId: currentUser.uid  
      };  

      // Add to Firestore  
      await firestore()  
        .collection('users')  
        .doc(currentUser.uid)  
        .collection('testResults')  
        .add(testResult);  

      // Success alert  
      Alert.alert('Başarılı', 'Test sonucu başarıyla eklendi');  
      
      // Reset form  
      setTestValue('');  
      setSelectedTest('');  
    } catch (error) {  
      console.error('Test sonucu eklenirken hata:', error);  
      Alert.alert('Hata', 'Test sonucu eklenemedi');  
    }  
  };  

  return (  
    <ScrollView style={styles.container}>  
      <Text style={styles.title}>Tahlil Sonucu Ekle</Text>  
      
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

      <View style={styles.inputContainer}>  
        <Text style={styles.label}>Test Değeri</Text>  
        <TextInput  
          style={styles.input}  
          value={testValue}  
          onChangeText={setTestValue}  
          keyboardType="decimal-pad"  
          placeholder="Örn: 4,34"  
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