import React, { useState, useEffect } from 'react';  
import {   
  View,   
  Text,   
  StyleSheet,   
  Image,   
  TouchableOpacity,   
  Modal,   
  TextInput,   
  Alert,  
  ScrollView   
} from 'react-native';  
import { Feather, MaterialIcons } from '@expo/vector-icons';   
import auth from '@react-native-firebase/auth';  
import firestore from '@react-native-firebase/firestore';    

export default function profile() {  
  const user = auth().currentUser;  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);  
  const [profileImage, setProfileImage] = useState<string | null>(null);  
  const [userData, setUserData] = useState({  
    firstName: '',  
    lastName: '',  
    email: user?.email || '',  
    phone: '',  
  });  

  // Fetch additional user details from Firestore  
  useEffect(() => {  
    const fetchUserDetails = async () => {  
      try {  
        const userDoc = await firestore()  
          .collection('admin')  
          .doc(user?.uid)  
          .get();  

        if (userDoc.exists) {  
          const data = userDoc.data();  
          setUserData({  
            firstName: data?.firstName || '',  
            lastName: data?.lastName || '',  
            email: user?.email || '',  
            phone: data?.phone || '',  
          });  
          setProfileImage(data?.profileImage || null);  
        }  
      } catch (error) {  
        console.error('Error fetching user details:', error);  
      }  
    };  

    fetchUserDetails();  
  }, [user?.uid]);  

  // Image Picker  


  // Update Profile  
  const updateProfile = async () => {  
    try {  
      // Update Firestore document  
      await firestore()  
        .collection('admin')  
        .doc(user?.uid)  
        .update({  
          firstName: userData.firstName,  
          lastName: userData.lastName,  
          phone: userData.phone,  
        });  

      // Update Firebase Auth display name if changed  
      if (userData.firstName || userData.lastName) {  
        await user?.updateProfile({  
          displayName: `${userData.firstName} ${userData.lastName}`.trim()  
        });  
      }  

      Alert.alert('Başarılı', 'Profil güncellendi');  
      setIsEditModalVisible(false);  
    } catch (error) {  
      console.error('Profile update error:', error);  
      Alert.alert('Hata', 'Profil güncellenemedi');  
    }  
  };  

  // Change Password  
  const changePassword = async () => {  
    try {  
      await auth().sendPasswordResetEmail(user?.email || '');  
      Alert.alert('Şifre Sıfırlama', 'Şifre sıfırlama bağlantısı e-postanıza gönderildi');  
    } catch (error) {  
      console.error('Password reset error:', error);  
      Alert.alert('Hata', 'Şifre sıfırlama bağlantısı gönderilemedi');  
    }  
  };  

  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.profileHeader}>  
        <Text style={styles.name}>  
          {userData.firstName} {userData.lastName}  
        </Text>  
        <Text style={styles.email}>{user?.email}</Text>  
      </View>  

      <View style={styles.actionContainer}>  
        <TouchableOpacity   
          style={styles.actionButton}  
          onPress={() => setIsEditModalVisible(true)}  
        >  
          <MaterialIcons name="edit" size={24} color="#6a0dad" />  
          <Text style={styles.actionText}>Profili Düzenle</Text>  
        </TouchableOpacity>  

        <TouchableOpacity   
          style={styles.actionButton}  
          onPress={changePassword}  
        >  
          <Feather name="lock" size={24} color="#6a0dad" />  
          <Text style={styles.actionText}>Şifreyi Değiştir</Text>  
        </TouchableOpacity>  
      </View>  

      <View style={styles.infoContainer}>  
        <Text style={styles.infoTitle}>Hesap Bilgileri</Text>  
        <Text>E-posta: {user?.email}</Text>  
        <Text>Kayıt Tarihi: {user?.metadata.creationTime}</Text>  
        <Text>Son Giriş: {user?.metadata.lastSignInTime}</Text>  
      </View>  

      {/* Edit Profile Modal */}  
      <Modal  
        visible={isEditModalVisible}  
        transparent={true}  
        animationType="slide"  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalContent}>  
            <Text style={styles.modalTitle}>Profili Düzenle</Text>  
            
            <TextInput  
              style={styles.input}  
              placeholder="Ad"  
              value={userData.firstName}  
              onChangeText={(text) => setUserData({...userData, firstName: text})}  
            />  
            
            <TextInput  
              style={styles.input}  
              placeholder="Soyad"  
              value={userData.lastName}  
              onChangeText={(text) => setUserData({...userData, lastName: text})}  
            />  
            
            <TextInput  
              style={styles.input}  
              placeholder="Telefon Numarası"  
              value={userData.phone}  
              onChangeText={(text) => setUserData({...userData, phone: text})}  
              keyboardType="phone-pad"  
            />  

            <View style={styles.modalButtonContainer}>  
              <TouchableOpacity   
                style={styles.modalButton}  
                onPress={() => setIsEditModalVisible(false)}  
              >  
                <Text style={styles.modalButtonText}>İptal</Text>  
              </TouchableOpacity>  
              
              <TouchableOpacity   
                style={[styles.modalButton, styles.saveButton]}  
                onPress={updateProfile}  
              >  
                <Text style={styles.modalButtonText}>Kaydet</Text>  
              </TouchableOpacity>  
            </View>  
          </View>  
        </View>  
      </Modal>  
    </ScrollView>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#f5f5f5',  
  },  
  profileHeader: {  
    alignItems: 'center',  
    paddingTop: 50,  
    backgroundColor: 'white',  
    paddingBottom: 20,  
    borderBottomLeftRadius: 20,  
    borderBottomRightRadius: 20,  
  },  
  profileImage: {  
    width: 150,  
    height: 150,  
    borderRadius: 75,  
    marginBottom: 20,  
  },  
  editIconOverlay: {  
    position: 'absolute',  
    bottom: 20,  
    right: 0,  
    backgroundColor: '#6a0dad',  
    borderRadius: 20,  
    padding: 5,  
  },  
  name: {  
    fontSize: 22,  
    fontWeight: 'bold',  
    marginBottom: 10,  
  },  
  email: {  
    fontSize: 16,  
    color: 'gray',  
  },  
  actionContainer: {  
    flexDirection: 'row',  
    justifyContent: 'space-around',  
    marginVertical: 20,  
  },  
  actionButton: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    backgroundColor: 'white',  
    padding: 10,  
    borderRadius: 10,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  actionText: {  
    marginLeft: 10,  
    color: '#6a0dad',  
  },  
  infoContainer: {  
    width: '90%',  
    alignSelf: 'center',  
    backgroundColor: 'white',  
    padding: 20,  
    borderRadius: 10,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  infoTitle: {  
    fontSize: 18,  
    fontWeight: 'bold',  
    marginBottom: 15,  
    color: '#6a0dad',  
  },  
  // Modal Styles  
  modalContainer: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    backgroundColor: 'rgba(0,0,0,0.5)',  
  },  
  modalContent: {  
    width: '85%',  
    backgroundColor: 'white',  
    borderRadius: 20,  
    padding: 20,  
    alignItems: 'center',  
  },  
  modalTitle: {  
    fontSize: 20,  
    fontWeight: 'bold',  
    marginBottom: 20,  
    color: '#6a0dad',  
  },  
  input: {  
    width: '100%',  
    borderBottomWidth: 1,  
    borderBottomColor: '#6a0dad',  
    marginBottom: 20,  
    paddingVertical: 10,  
  },  
  modalButtonContainer: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    width: '100%',  
  },  
  modalButton: {  
    flex: 1,  
    padding: 10,  
    margin: 5,  
    borderRadius: 10,  
    alignItems: 'center',  
  },  
  saveButton: {  
    backgroundColor: '#6a0dad',  
  },  
  modalButtonText: {  
    color: 'white',  
    fontWeight: 'bold',  
  },  
});