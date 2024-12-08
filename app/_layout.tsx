import { Stack, useRouter, useSegments } from 'expo-router';  
import { useEffect, useState } from 'react';  
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';  
import { View, ActivityIndicator, StyleSheet } from 'react-native';  

export default function RootLayout() {  
	const [initializing, setInitializing] = useState(true);  
	const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);  
	const router = useRouter();  
	const segments = useSegments();  

	return (  
		<Stack>  
			<Stack.Screen 
				name="Splash" 
				options={{ 
					headerShown: false,
					gestureEnabled: false 
				}} 
			/>
			<Stack.Screen name="index" options={{ title: 'Login' }} />  
			<Stack.Screen name="(auth)" options={{ headerShown: false }} />  
			<Stack.Screen name="(admin)" options={{ headerShown: false }} />  
			<Stack.Screen name="Register" options={{ title:'Kayıt Ol', headerShown: false }} />  
		</Stack>  
	);  
}  

const styles = StyleSheet.create({  
	loadingContainer: {  
		flex: 1,  
		justifyContent: 'center',  
		alignItems: 'center',  
	},  
});