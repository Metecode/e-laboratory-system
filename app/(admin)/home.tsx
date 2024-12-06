import { View, Text, Button, StyleSheet } from 'react-native';  
import { useRouter } from 'expo-router';  
import auth from '@react-native-firebase/auth';

export default function HomeScreen() {  
    const router = useRouter();  

    const handleSignOut = async () => {  
        try {  
            await auth().signOut();  
            router.replace('/');  
        } catch (error) {  
            console.error('Sign out error: ', error);  
        }  
    };  

    return (  
        <View style={styles.container}>  
            <Button title="Sign Out" onPress={handleSignOut} />  
        </View>  
    );  
}  

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