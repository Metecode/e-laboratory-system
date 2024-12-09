import { useEffect, useState } from 'react';
import {
	Text,
	View,
	StyleSheet,
	KeyboardAvoidingView,
	TextInput,
	Button,
	ActivityIndicator,
	TouchableOpacity
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { FirebaseError } from 'firebase/app';
import firestore from '@react-native-firebase/firestore';
import { router, useRouter } from 'expo-router';
export default function Index() {
		return (
			<View style={styles.container}>
			  <TouchableOpacity
				style={styles.btn}
				onPress={() => {
					router.replace('/AdminLogin');
				}}>
				<Text style={styles.btnText}>Yetkili Girişi</Text>
			  </TouchableOpacity>
			  <TouchableOpacity
				style={styles.btn}
				onPress={() => {
					router.replace('/UserLogin');
				}}>
				<Text style={styles.btnText}>Kullanıcı Girişi</Text>
			  </TouchableOpacity>
			</View>
		  );
}

const styles = StyleSheet.create({
	container: {
	  flex: 1,
	  justifyContent: 'center',
	  alignItems: 'center',
	},
	title: {
	  fontSize: 20,
	  fontWeight: '700',
	},
	btn: {
	  backgroundColor: 'purple',
	  height: 50,
	  width: '90%',
	  borderRadius: 10,
	  justifyContent: 'center',
	  alignItems: 'center',
	  marginTop: 30,
	},
	btnText: {
	  fontSize: 18,
	  color: '#fff',
	  fontWeight: '600',
	},
	selectLangaugeBtn: {
	  width: '50%',
	  height: 50,
	  borderWidth: 0.2,
	  borderRadius: 10,
	  position: 'absolute',
	  alignSelf: 'center',
	  bottom: 20,
	  justifyContent: 'center',
	  alignItems: 'center',
	  marginTop: 20,
	},
  });