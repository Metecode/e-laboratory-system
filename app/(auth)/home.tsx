// app/(admin)/home.tsx  
import { View, Text, Button, StyleSheet } from 'react-native';  
import auth from '@react-native-firebase/auth';  
import { useRouter } from 'expo-router';  

const HomeScreen = () => {  
	const router = useRouter();  
	const { user } = router.params; // Access user data from router params  

	const handleSignOut = async () => {  
		try {  
			await auth().signOut();  
			router.replace('/'); // Redirect to login after signing out  
		} catch (error) {  
			console.error('Sign out error: ', error);  
		}  
	};  

	return (  
		<View style={styles.container}>  
			<Text style={styles.title}>Welcome, {user?.email}!</Text> {/* Safely access user email */}  
			<Button title="Sign Out" onPress={handleSignOut} />  
		</View>  
	);  
};  

const styles = StyleSheet.create({  
	container: {  
		flex: 1,  
		justifyContent: 'center',  
		alignItems: 'center',  
		padding: 20,  
	},  
	title: {  
		fontSize: 24,  
		fontWeight: 'bold',  
		marginBottom: 20,  
	},  
});  

export default HomeScreen;