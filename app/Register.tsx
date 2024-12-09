import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  StyleSheet,
  TextInput,
  View,
  Platform,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import auth from '@react-native-firebase/auth';
import { FirebaseError } from 'firebase/app';
import firestore from '@react-native-firebase/firestore';
import uuid from 'react-native-uuid';
import { router } from 'expo-router';
import { RadioButton } from 'react-native-paper';
import SelectDropdown from 'react-native-select-dropdown'

const { width, height } = Dimensions.get('window');

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [cities, setCities] = useState([]);

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
      } else {
        console.error('API response format is not as expected:', result);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

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

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date: any) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const signUp = async () => {
    // Validasyon kontrolleri  
    if (!fname.trim()) {
      alert('Please enter first name');
      return;
    }
    if (!lname.trim()) {
      alert('Please enter last name');
      return;
    }
    if (!idNumber.trim()) {
      alert('Please enter ID number');
      return;
    }
    if (!dateOfBirth) {
      alert('Please select date of birth');
      return;
    }
    if (!gender) {
      alert('Please select gender');
      return;
    }
    if (!email.trim()) {
      alert('Please enter email');
      return;
    }
    if (!password.trim()) {
      alert('Please enter password');
      return;
    }

    setLoading(true);
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      const user = auth().currentUser;
      if (user) {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .set({
            firstName: fname,
            lastName: lname,
            idNumber: idNumber,
            uid: user.uid,
            email: email,
            password: password,
            birthDate: dateOfBirth ? formatFirestoreDate(dateOfBirth) : null,
            birthPlace: birthPlace,
            age: age,
            gender: gender
          });

        alert('Check your emails!');
        router.replace('/(auth)/home');
      }
    } catch (e: any) {
      const err = e as FirebaseError;
      alert('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFirestoreDate = (date: Date) => {  
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;  
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
          <Text style={styles.title}>Hesap Oluştur</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad</Text>
            <TextInput
              style={styles.input}
              value={fname}
              onChangeText={setFname}
              autoCapitalize="words"
              placeholder="İsiminizi giriniz"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Soyad</Text>
            <TextInput
              style={styles.input}
              value={lname}
              onChangeText={setLname}
              autoCapitalize="words"
              placeholder="Soyadınızı giriniz"
            />
          </View>

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
              placeholder="11 haneli kimlik numaranızı giriniz"
              maxLength={11}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doğum Tarihi</Text>
            <TouchableOpacity onPress={showDatepicker} style={styles.dateInput}>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doğum Yeri</Text>
            <SelectDropdown
              data={cities}
              onSelect={(selectedItem, index) => {
                setBirthPlace(selectedItem.value);
              }}
              renderButton={(selectedItem, isOpened) => {
                return (
                  <View style={styles.dropdownButtonStyle}>
                    <Text style={styles.dropdownButtonTxtStyle}>
                      {selectedItem ? selectedItem.label : 'İl Seçiniz'}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="E-posta adresinizi giriniz"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Şifrenizi giriniz"
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
          ) : (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={signUp}
            >
              <Text style={styles.submitButtonText}>Hesap Oluştur</Text>
            </TouchableOpacity>
          )}

          <View style={styles.accountLinkContainer}>
            <Text style={styles.accountLinkText}>
              Zaten bir hesabım var?
            </Text>
            <TouchableOpacity onPress={() => {
              router.replace(
                '/home' // Query parametreleri
              );
            }}>
              <Text style={styles.accountLinkButton}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    marginTop: 10,
  },
  keyboardView: {
    flex: 1,
  },
  formContainer: {
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: width * 0.9,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333'
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 5,
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  dateInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateText: {
    color: '#333',
    fontSize: 14,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 15,
  },
  dropdownButtonStyle: {
    width: '100%',
    height: 45,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#151E26',
  },
  accountLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  accountLinkText: {
    fontSize: 14,
    color: '#666',
  },
  accountLinkButton: {
    fontSize: 14,
    color: '#228be6',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});