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

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const adminLogin = async () => {
    setLoading(true);
    try {
      // Firebase Authentication ile giriş yap
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
  
      // Giriş yapan kullanıcının UID'sini al
      const { uid } = userCredential.user;
  
      // İzin verilen UID'ler
      const allowedUids = ['vzKY8jtMn2ZgYKOzqmAKQInI8Fn2', 'OoJp7XPAzg1Lr2yPAvMQ'];
  
      if (allowedUids.includes(uid)) {
        // Admin verilerini query parametreleriyle aktar
        router.replace('/(admin)/home');
        alert('Giriş başarılı!'); // Giriş başarılı uyarısı
      } else {
        alert('Yetkisiz giriş!'); // Yetkisiz giriş uyarısı
        await auth().signOut(); // Kullanıcıyı çıkış yap
      }
    } catch (error) {
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
                '/UserLogin' // Query parametreleri
              );
            }}
        >
          <Text style={styles.text} >Hasta girişi için tıklayınız</Text>
        </TouchableOpacity>
        {loading ? (
          <ActivityIndicator size={'small'} style={{ margin: 28 }} />
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => {
              if (email !== '' && password !== '') {
                adminLogin();
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
