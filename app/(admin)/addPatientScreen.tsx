import React, { useEffect, useState } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  TextInput,  
  TouchableOpacity,  
  ScrollView,  
  KeyboardAvoidingView,  
  Platform,  
  ActivityIndicator  
} from 'react-native';  
import DateTimePicker from '@react-native-community/datetimepicker';  
import { RadioButton } from 'react-native-paper';  
import SelectDropdown from 'react-native-select-dropdown';  
import firestore from '@react-native-firebase/firestore';  
import { useRouter } from 'expo-router';  

interface City {  
  label: string;  
  value: string;  
}  

export default function addPatientScreen() {  
  const router = useRouter();  
  const [loading, setLoading] = useState(false);  
  const [cities, setCities] = useState<City[]>([]);  

  // Form State  
  const [firstName, setFirstName] = useState('');  
  const [lastName, setLastName] = useState('');  
  const [idNumber, setIdNumber] = useState('');  
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);  
  const [showDatePicker, setShowDatePicker] = useState(false);  
  const [age, setAge] = useState('');  
  const [gender, setGender] = useState('');  
  const [birthPlace, setBirthPlace] = useState('');  
  const [email, setEmail] = useState('');  
  const [phone, setPhone] = useState('');  

  // Fetch Cities  
  const fetchCities = async () => {  
    try {  
      const response = await fetch('https://turkiyeapi.dev/api/v1/provinces');  
      const result = await response.json();  

      if (result && result.data) {  
        const cityOptions = result.data.map((city: { name: string }) => ({  
          label: city.name,  
          value: city.name  
        }));  

        setCities(cityOptions);  
      }  
    } catch (error) {  
      console.error('Error fetching cities:', error);  
    }  
  };  

  useEffect(() => {  
    fetchCities();  
  }, []);  

  // Date Change Handler  
  const onDateChange = (event: any, selectedDate: any) => {  
    const currentDate = selectedDate || dateOfBirth;  
    setShowDatePicker(Platform.OS === 'ios');  
    setDateOfBirth(currentDate);  

    const today = new Date();  
    let calculatedAge = today.getFullYear() - currentDate.getFullYear();  
    const m = today.getMonth() - currentDate.getMonth();  
    if (m < 0 || (m === 0 && today.getDate() < currentDate.getDate())) {  
      calculatedAge--;  
    }  
    setAge(calculatedAge.toString());  
  };  

  // Format Date  
  const formatDate = (date: Date) => {  
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;  
  };  

  // Firestore Date Format  
  const formatFirestoreDate = (date: Date) => {  
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;  
  };   

  // Add Patient  
  const addPatient = async () => {  
    // Validation  
    if (!firstName.trim()) {  
      alert('Lütfen adı giriniz');  
      return;  
    }  
    if (!lastName.trim()) {  
      alert('Lütfen soyadı giriniz');  
      return;  
    }  
    if (!idNumber.trim()) {  
      alert('Lütfen kimlik numarasını giriniz');  
      return;  
    }  
    if (!dateOfBirth) {  
      alert('Lütfen doğum tarihini seçiniz');  
      return;  
    }  
    if (!gender) {  
      alert('Lütfen cinsiyeti seçiniz');  
      return;  
    }  

    setLoading(true);  
    try {  
      // Generate a unique ID for the patient  
      const patientId = firestore().collection('users').doc().id;  

      // Add patient to Firestore  
      await firestore()  
        .collection('users')  
        .doc(patientId)  
        .set({  
          id: patientId,  
          firstName,  
          lastName,  
          idNumber,  
          birthDate: dateOfBirth ? formatFirestoreDate(dateOfBirth) : null,  
          birthPlace,  
          age,  
          gender,  
          email: email || null,  
          phone: phone || null,  
          createdAt: firestore.FieldValue.serverTimestamp()  
        });  

      alert('Hasta başarıyla eklendi');  
      // Reset form or navigate back  
      router.back();  
    } catch (error) {  
      console.error('Hasta eklenirken hata oluştu:', error);  
      alert('Hasta eklenirken bir hata oluştu');  
    } finally {  
      setLoading(false);  
    }  
  };  

  return (  
    <ScrollView  
      contentContainerStyle={styles.container}  
      keyboardShouldPersistTaps="handled"  
    >  
      <KeyboardAvoidingView  
        behavior={Platform.OS === "ios" ? "padding" : "height"}  
        style={styles.keyboardView}  
      >  
        <View style={styles.formContainer}>  
          <Text style={styles.title}>Yeni Hasta Ekle</Text>  

          {/* First Name */}  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Ad</Text>  
            <TextInput  
              style={styles.input}  
              value={firstName}  
              onChangeText={setFirstName}  
              autoCapitalize="words"  
              placeholder="Hasta adını giriniz"  
            />  
          </View>  

          {/* Last Name */}  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Soyad</Text>  
            <TextInput  
              style={styles.input}  
              value={lastName}  
              onChangeText={setLastName}  
              autoCapitalize="words"  
              placeholder="Hasta soyadını giriniz"  
            />  
          </View>  

          {/* ID Number */}  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Kimlik Numarası</Text>  
            <TextInput  
              style={styles.input}  
              value={idNumber}  
              onChangeText={(text) => {  
                const numbersOnly = text.replace(/[^0-9]/g, '');  
                setIdNumber(numbersOnly);  
              }}  
              keyboardType="numeric"  
              placeholder="11 haneli kimlik numarasını giriniz"  
              maxLength={11}  
            />  
          </View>  

          {/* Date of Birth */}  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Doğum Tarihi</Text>  
            <TouchableOpacity   
              onPress={() => setShowDatePicker(true)}   
              style={styles.dateInput}  
            >  
              <Text style={styles.dateText}>  
                {dateOfBirth ? formatDate(dateOfBirth) : "Doğum Tarihi Seç"}  
              </Text>  
            </TouchableOpacity>  
            {showDatePicker && (  
              <DateTimePicker  
                testID="dateTimePicker"  
                value={dateOfBirth || new Date()}  
                mode="date"  
                display="default"  
                onChange={onDateChange}  
                maximumDate={new Date()}  
              />  
            )}  
          </View>  

          {/* Birth Place */}  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Doğum Yeri</Text>  
            <SelectDropdown  
              data={cities}  
              onSelect={(selectedItem) => {  
                setBirthPlace(selectedItem.value);  
              }}  
              renderButton={(selectedItem) => (  
                <View style={styles.dropdownButtonStyle}>  
                  <Text style={styles.dropdownButtonTxtStyle}>  
                    {selectedItem ? selectedItem.label : 'İl Seçiniz'}  
                  </Text>  
                </View>  
              )}  
              renderItem={(item, index, isSelected) => (  
                <View style={{  
                  ...styles.dropdownItemStyle,  
                  ...(isSelected && { backgroundColor: '#D2D9DF' })  
                }}>  
                  <Text style={styles.dropdownItemTxtStyle}>  
                    {item.label}  
                  </Text>  
                </View>  
              )}  
              showsVerticalScrollIndicator={false}  
              dropdownStyle={styles.dropdownMenuStyle}  
            />  
          </View>  

          {/* Gender */}  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Cinsiyet</Text>  
            <View style={styles.radioContainer}>  
              <View style={styles.radioItem}>  
                <RadioButton  
                  value="Erkek"  
                  status={gender === 'Erkek' ? 'checked' : 'unchecked'}  
                  onPress={() => setGender('Erkek')}  
                />  
                <Text>Erkek</Text>  
              </View>  
              <View style={styles.radioItem}>  
                <RadioButton  
                  value="Kadin"  
                  status={gender === 'Kadin' ? 'checked' : 'unchecked'}  
                  onPress={() => setGender('Kadin')}  
                />  
                <Text>Kadın</Text>  
              </View>  
            </View>  
          </View>  

          {/* Email (Optional) */}  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Email (İsteğe Bağlı)</Text>  
            <TextInput  
              style={styles.input}  
              value={email}  
              onChangeText={setEmail}  
              autoCapitalize="none"  
              keyboardType="email-address"  
              placeholder="E-posta adresini giriniz"  
            />  
          </View>  

          {/* Phone (Optional) */}  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Telefon (İsteğe Bağlı)</Text>  
            <TextInput  
              style={styles.input}  
              value={phone}  
              onChangeText={setPhone}  
              keyboardType="phone-pad"  
              placeholder="Telefon numarasını giriniz"  
            />  
          </View>  

          {/* Submit Button */}  
          {loading ? (  
            <ActivityIndicator size="large" color="#6a0dad" style={styles.loader} />  
          ) : (  
            <TouchableOpacity  
              style={styles.submitButton}  
              onPress={addPatient}  
            >  
              <Text style={styles.submitButtonText}>Hasta Ekle</Text>  
            </TouchableOpacity>  
          )}  
        </View>  
      </KeyboardAvoidingView>  
    </ScrollView>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flexGrow: 1,  
    backgroundColor: '#f5f5f5',  
    paddingVertical: 20,  
  },  
  keyboardView: {  
    flex: 1,  
  },  
  formContainer: {  
    paddingHorizontal: 20,  
  },  
  title: {  
    fontSize: 24,  
    fontWeight: 'bold',  
    color: '#6a0dad',  
    textAlign: 'center',  
    marginBottom: 20,  
  },  
  inputGroup: {  
    marginBottom: 15,  
  },  
  label: {  
    marginBottom: 5,  
    color: '#333',  
    fontWeight: '500',  
  },  
  input: {  
    backgroundColor: 'white',  
    borderWidth: 1,  
    borderColor: '#ddd',  
    borderRadius: 8,  
    paddingHorizontal: 10,  
    paddingVertical: 12,  
  },  
  dateInput: {  
    backgroundColor: 'white',  
    borderWidth: 1,  
    borderColor: '#ddd',  
    borderRadius: 8,  
    paddingHorizontal: 10,  
    paddingVertical: 12,  
  },  
  dateText: {  
    color: '#333',  
  },  
  radioContainer: {  
    flexDirection: 'row',  
    justifyContent: 'space-around',  
  },  
  radioItem: {  
    flexDirection: 'row',  
    alignItems: 'center',  
  },  
  dropdownButtonStyle: {  
    backgroundColor: 'white',  
    borderWidth: 1,  
    borderColor: '#ddd',  
    borderRadius: 8,  
    paddingHorizontal: 10,  
    paddingVertical: 12,  
  },  
  dropdownButtonTxtStyle: {  
    color: '#333',  
  },  
  dropdownItemStyle: {  
    padding: 10,  
  },  
  dropdownItemTxtStyle: {  
    color: '#333',  
  },  
  dropdownMenuStyle: {  
    backgroundColor: 'white',  
    borderRadius: 8,  
  },  
  submitButton: {  
    backgroundColor: '#6a0dad',  
    borderRadius: 10,  
    paddingVertical: 15,  
    alignItems: 'center',  
    marginTop: 20,  
  },  
  submitButtonText: {  
    color: 'white',  
    fontSize: 18,  
    fontWeight: 'bold',  
  },  
  loader: {  
    marginTop: 20,  
  },  
});