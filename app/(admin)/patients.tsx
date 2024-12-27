import React, { useState, useEffect } from 'react';  
import {   
  View,   
  Text,   
  FlatList,   
  StyleSheet,   
  TouchableOpacity,   
  ActivityIndicator,   
  TextInput,   
  Modal,   
  Pressable   
} from 'react-native';  
import firestore from '@react-native-firebase/firestore';  
import Icon from 'react-native-vector-icons/Ionicons';  

// Patient interface tipini tanımlayın  
interface Patient {  
  id: string;  
  firstName: string;  
  lastName: string;  
  gender: string;  
  age: number;  
  phone: string;  
  email?: string;  
  address?: string;  
}  

const PatientList = () => {  
  const [patients, setPatients] = useState<Patient[]>([]);  
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);  
  const [loading, setLoading] = useState<boolean>(true);  
  const [searchText, setSearchText] = useState<string>('');  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);  
  const [modalVisible, setModalVisible] = useState<boolean>(false);  

  useEffect(() => {  
    const fetchPatients = async () => {  
      try {  
        const patientCollection = await firestore().collection('users').get();  
        
        const patientList: Patient[] = patientCollection.docs.map(doc => ({  
          ...doc.data() as Patient,
          id: doc.id  
        }));  

        setPatients(patientList);  
        setFilteredPatients(patientList);  
        setLoading(false);  
      } catch (error) {  
        console.error('Hasta listesi getirilirken hata oluştu:', error);  
        setLoading(false);  
      }  
    };  

    fetchPatients();  
  }, []);  

  // Arama fonksiyonu  
  useEffect(() => {  
    if (searchText) {  
      const filtered = patients.filter(patient =>   
        `${patient.firstName} ${patient.lastName}`  
          .toLowerCase()  
          .includes(searchText.toLowerCase())  
      );  
      setFilteredPatients(filtered);  
    } else {  
      setFilteredPatients(patients);  
    }  
  }, [searchText, patients]);  

  const openPatientDetails = (patient: Patient) => {  
    setSelectedPatient(patient);  
    setModalVisible(true);  
  };  

  const renderPatientItem = ({ item }: { item: Patient }) => (  
    <TouchableOpacity  
      style={styles.patientItem}  
      onPress={() => openPatientDetails(item)}  
    >  
      <View style={styles.patientInfo}>  
        <Text style={styles.patientName}>  
          {item.firstName} {item.lastName}  
        </Text>  
        <View style={styles.patientDetailsContainer}>  
          <View style={styles.patientDetailsColumn}>  
            <Text style={styles.patientDetails}>  
              <Icon name="male-female" size={14} />   
              {item.gender}  
            </Text>  
            <Text style={styles.patientDetails}>  
              <Icon name="calendar" size={14} />   
              {item.age} yaş  
            </Text>  
          </View>  
          <View style={styles.patientDetailsColumn}>  
            <Text style={styles.patientDetails}>  
              <Icon name="call" size={14} />   
              {item.phone}  
            </Text>  
          </View>  
        </View>  
      </View>  
    </TouchableOpacity>  
  );  

  const PatientDetailModal = () => {  
    if (!selectedPatient) return null;  

    return (  
      <Modal  
        animationType="slide"  
        transparent={true}  
        visible={modalVisible}  
        onRequestClose={() => setModalVisible(false)}  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalContent}>  
            <Text style={styles.modalTitle}>Hasta Detayları</Text>  
            <View style={styles.modalDetailsContainer}>  
              <Text style={styles.modalDetailText}>  
                <Icon name="person" size={16} />   
                Ad Soyad: {selectedPatient.firstName} {selectedPatient.lastName}  
              </Text>  
              <Text style={styles.modalDetailText}>  
                <Icon name="male-female" size={16} />   
                Cinsiyet: {selectedPatient.gender}  
              </Text>  
              <Text style={styles.modalDetailText}>  
                <Icon name="calendar" size={16} />   
                Yaş: {selectedPatient.age}  
              </Text>  
              <Text style={styles.modalDetailText}>  
                <Icon name="call" size={16} />   
                Telefon: {selectedPatient.phone}  
              </Text>  
              {selectedPatient.email && (  
                <Text style={styles.modalDetailText}>  
                  <Icon name="mail" size={16} />   
                  E-posta: {selectedPatient.email}  
                </Text>  
              )}  
              {selectedPatient.address && (  
                <Text style={styles.modalDetailText}>  
                  <Icon name="location" size={16} />   
                  Adres: {selectedPatient.address}  
                </Text>  
              )}  
            </View>  
            <Pressable  
              style={styles.modalCloseButton}  
              onPress={() => setModalVisible(false)}  
            >  
              <Text style={styles.modalCloseButtonText}>Kapat</Text>  
            </Pressable>  
          </View>  
        </View>  
      </Modal>  
    );  
  };  

  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#0000ff" />  
        <Text>Hastalar yükleniyor...</Text>  
      </View>  
    );  
  }  

  return (  
    <View style={styles.container}>  
      <Text style={styles.title}>Hasta Listesi</Text>  
      
      <View style={styles.searchContainer}>  
        <Icon name="search" size={20} color="#888" style={styles.searchIcon} />  
        <TextInput  
          style={styles.searchInput}  
          placeholder="Hasta Ara..."  
          value={searchText}  
          onChangeText={setSearchText}  
        />  
      </View>  

      {filteredPatients.length === 0 ? (  
        <View style={styles.emptyContainer}>  
          <Text style={styles.emptyText}>  
            {searchText   
              ? "Aranan kriterlere uygun hasta bulunamadı."   
              : "Henüz hasta kaydı bulunmamaktadır."}  
          </Text>  
        </View>  
      ) : (  
        <FlatList  
          data={filteredPatients}  
          renderItem={renderPatientItem}  
          keyExtractor={(item) => item.id}  
          contentContainerStyle={styles.listContainer}  
        />  
      )}  

      <PatientDetailModal />  
    </View>  
  );  
};  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#f5f5f5',  
    paddingTop: 20,  
  },  
  title: {  
    fontSize: 22,  
    fontWeight: 'bold',  
    textAlign: 'center',  
    marginBottom: 15,  
    color: '#333',  
  },  
  searchContainer: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    paddingHorizontal: 15,  
    marginBottom: 10,  
  },  
  searchIcon: {  
    position: 'absolute',  
    left: 25,  
    zIndex: 1,  
  },  
  searchInput: {  
    flex: 1,  
    height: 40,  
    borderColor: '#ddd',  
    borderWidth: 1,  
    borderRadius: 8,  
    paddingHorizontal: 40,  
    backgroundColor: 'white',  
  },  
  listContainer: {  
    paddingHorizontal: 15,  
  },  
  patientItem: {  
    backgroundColor: 'white',  
    borderRadius: 10,  
    padding: 15,  
    marginBottom: 10,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  patientInfo: {  
    flexDirection: 'column',  
  },  
  patientName: {  
    fontSize: 18,  
    fontWeight: 'bold',  
    marginBottom: 10,  
    color: '#2c3e50',  
  },  
  patientDetailsContainer: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
  },  
  patientDetailsColumn: {  
    flexDirection: 'column',  
  },  
  patientDetails: {  
    fontSize: 14,  
    color: '#7f8c8d',  
    marginBottom: 5,  
    alignItems: 'center',  
  },  
  loadingContainer: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  emptyContainer: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    marginTop: 50,  
  },  
  emptyText: {  
    fontSize: 16,  
    color: '#7f8c8d',  
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
    borderRadius: 10,  
    padding: 20,  
    alignItems: 'center',  
  },  
  modalTitle: {  
    fontSize: 20,  
    fontWeight: 'bold',  
    marginBottom: 15,  
    color: '#2c3e50',  
  },  
  modalDetailsContainer: {  
    width: '100%',  
    marginBottom: 15,  
  },  
  modalDetailText: {  
    fontSize: 16,  
    marginBottom: 10,  
    color: '#34495e',  
  },  
  modalCloseButton: {  
    backgroundColor: '#3498db',  
    paddingVertical: 10,  
    paddingHorizontal: 20,  
    borderRadius: 5,  
  },  
  modalCloseButtonText: {  
    color: 'white',  
    fontSize: 16,  
    fontWeight: 'bold',  
  },  
});  

export default PatientList;