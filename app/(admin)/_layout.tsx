import { Stack, Redirect } from 'expo-router';  // Adjust path as needed  

export default function AdminLayout() {  

    return (  
        <Stack screenOptions={{ headerShown: false }}>  
            <Stack.Screen name="home" />  
        </Stack>  
    );  
}