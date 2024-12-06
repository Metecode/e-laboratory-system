import { Stack, useRouter, useSegments } from 'expo-router';  
import { useEffect, useState } from 'react';  
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';  
import { View, ActivityIndicator, StyleSheet } from 'react-native';  

export default function RootLayout() {  
	const [initializing, setInitializing] = useState(true);  
	const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);  
	const router = useRouter();  
	const segments = useSegments();  

	const onAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {  
		console.log('onAuthStateChanged', user);  
		setUser(user);  
		if (initializing) setInitializing(false);  
	};  

	useEffect(() => {  
		const subscriber = auth().onAuthStateChanged(onAuthStateChanged);  
		return subscriber; // Cleanup subscription on unmount  
	}, []);  

	useEffect(() => {  
		if (initializing) return;  

		const inAuthGroup = segments[0] === '(auth)';  

		if (user && !inAuthGroup) {  
			router.replace('/(admin)/home'); // Pass user data here  
		} else if (!user && inAuthGroup) {  
			router.replace('/'); // Redirect to login if not authenticated  
		}  
	}, [user, initializing]);  

	if (initializing) {  
		return (  
			<View style={styles.loadingContainer}>  
				<ActivityIndicator size="large" />  
			</View>  
		);  
	}  

	return (  
		<Stack>  
			<Stack.Screen name="index" options={{ title: 'Login' }} />  
			<Stack.Screen name="(auth)" options={{ headerShown: false }} />  
			<Stack.Screen name="(admin)" options={{ headerShown: false }} />  
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