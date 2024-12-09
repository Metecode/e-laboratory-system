import { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';

export default function UserLogin() {
	const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const userLogin = async () => {
    setLoading(true);
    try {
      // Firebase Authentication ile giriş yap
      await auth().signInWithEmailAndPassword(email, password);

      // Admin verilerini query parametreleriyle aktar
      router.replace(
        '/(auth)/home' // Query parametreleri
      );
      alert('Login successful!');
    }
    catch (error) {
      console.error('Error during login: ', error);
      alert('An error occurred while logging in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Şifre"
        />
        <TouchableOpacity onPress={() => {
              router.replace(
                '/Register' // Query parametreleri
              );
            }}
        >
          <Text style={styles.text} >Kayıt olmak için tıklayınız.</Text>
        </TouchableOpacity>
        {loading ? (
          <ActivityIndicator size={'small'} style={{ margin: 28 }} />
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => {
              if (email !== '' && password !== '') {
                userLogin();
              } else {
                alert('Please Enter Data');
              }
            }}>
            <Text style={styles.btnText}>Giriş Yap</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
  },
  loginBtn: {
    backgroundColor: 'orange',
    width: '90%',
    height: 50,
    alignSelf: 'center',
    borderRadius: 10,
    marginTop: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text:{
    color: 'blue',
    textAlign: 'left',
    marginTop: 10,
    marginBottom: 10,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
});
