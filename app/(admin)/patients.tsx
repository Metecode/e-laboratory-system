import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientCollection = await firestore().collection('users').get();
        
        const patientList = patientCollection.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPatients(patientList);
        setLoading(false);
      } catch (error) {
        console.error('Hasta listesi getirilirken hata oluştu:', error);
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.patientItem}
    >
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>
          {item.name || 'İsimsiz Hasta'} {item.surname || ''}
        </Text>
        <Text style={styles.patientDetails}>
          Yaş: {item.age || 'Belirtilmemiş'}
        </Text>
        <Text style={styles.patientDetails}>
          Telefon: {item.phone || 'Kayıtlı Değil'}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
      {patients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz hasta kaydı bulunmamaktadır.</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
    marginBottom: 5,
    color: '#2c3e50',
  },
  patientDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 3,
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
});

export default patients;