import { Tabs } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AdminLayout() {
  const router = useRouter();

  // Logout function
  const handleLogout = async () => {
    try {
      await auth().signOut();
      // Navigate back to login screen
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6a0dad', // Purple theme
        },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#6a0dad',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
      }}
    >
      {/* Home/Dashboard Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'E-Laboratuvar Yönetim Paneli',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Patients Tab */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Hastalar',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />

      {/* Lab Results Tab */}
      <Tabs.Screen
        name="labResults"
        options={{
          title: 'Tahlil Sonuçları',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="science" size={size} color={color} />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />

      {/* Logout Tab */}
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Çıkış',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="logout" size={size} color={color} />
          ),
          tabBarButton: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#fff'
              }}
            >
              <MaterialIcons name="logout" size={24} color="red" />
            </TouchableOpacity>
          )
        }}
      />
      <Tabs.Screen
        name="addLabResult"  // veya hangi ismi kullandıysanız  
        options={{
          title: 'Tahlil Ekle',
          href: null, // Bu sayfayı tab bar'da göstermez  
        }}
      />
    </Tabs>
  );
}