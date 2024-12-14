import React, { useState, useEffect } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  FlatList,  
  TouchableOpacity,  
  TextInput,  
  ActivityIndicator  
} from 'react-native';  
import firestore from '@react-native-firebase/firestore';  
import { Feather } from '@expo/vector-icons';  

interface TestResult {  
  id: string;  
  value: number;  
  unit: string;  
  test_date: string;  
  age: number;
}  

interface UserTestResults {  
  id: string; // Firestore döküman ID'si  
  firstName: string;  
  lastName: string;  
  results: {  
    [key: string]: TestResult[];  
  };  
  lastUpdated: string;  
}  

const LabResults = () => {  
  const [testResults, setTestResults] = useState<UserTestResults[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [searchText, setSearchText] = useState('');  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'age' | 'name'>('all');  

  useEffect(() => {  
    fetchTestResults();  
  }, []);  

  const fetchTestResults = async () => {  
    try {  
      const snapshot = await firestore()  
        .collection('test_results')  
        .get();  

      const results = snapshot.docs.map(doc => ({  
        id: doc.id, // Döküman ID'sini ekledik  
        ...doc.data()  
      })) as UserTestResults[];  

      setTestResults(results);  
      setLoading(false);  
    } catch (error) {  
      console.error('Error fetching results:', error);  
      setLoading(false);  
    }  
  };  

  const getChangeIndicator = (currentValue: number, previousValue: number) => {  
    if (currentValue > previousValue) return '↑';  
    if (currentValue < previousValue) return '↓';  
    return '↔';  
  };  

  const filterResults = () => {  
    let filtered = [...testResults];  

    if (searchText) {  
      switch (selectedFilter) {  
        case 'age':  
          filtered = filtered.filter(result => {  
            const hasAgeMatch = Object.values(result.results).some(testArray =>  
              testArray.some(test => test.age.toString() === searchText)  
            );  
            return hasAgeMatch;  
          });  
          break;  
        case 'name':  
          filtered = filtered.filter(result =>  
            `${result.firstName} ${result.lastName}`  
              .toLowerCase()  
              .includes(searchText.toLowerCase())  
          );  
          break;  
      }  
    }  

    return filtered;  
  };  

  const renderTestItem = ({ item }: { item: UserTestResults }) => {  
    return (  
      <View style={styles.resultCard}>  
        <Text style={styles.patientName}>  
          {item.firstName} {item.lastName}  
        </Text>  
        
        {Object.entries(item.results).map(([testType, values]) => {  
          const sortedValues = [...values].sort((a, b) =>   
            new Date(b.test_date).getTime() - new Date(a.test_date).getTime()  
          );  
          
          const currentValue = sortedValues[0];  
          const previousValue = sortedValues[1];  
          
          return (  
            <View key={`${item.id}-${testType}`} style={styles.testRow}>  
              <Text style={styles.testType}>{testType}:</Text>  
              <Text style={styles.testValue}>  
                {currentValue.value} {currentValue.unit}  
                {previousValue && (  
                  <Text style={styles.changeIndicator}>  
                    {' '}{getChangeIndicator(currentValue.value, previousValue.value)}  
                  </Text>  
                )}  
              </Text>  
              <Text style={styles.testDate}>{currentValue.test_date}</Text>  
              <Text style={styles.patientAge}>Yaş: {currentValue.age}</Text>  
            </View>  
          );  
        })}  
      </View>  
    );  
  };  

  // Benzersiz key sağlayan keyExtractor  
  const keyExtractor = (item: UserTestResults) => item.id;  

  if (loading) {  
    return (  
      <View style={styles.centerContainer}>  
        <ActivityIndicator size="large" color="#0066cc" />  
      </View>  
    );  
  }  

  return (  
    <View style={styles.container}>  
      <View style={styles.searchContainer}>  
        <TextInput  
          style={styles.searchInput}  
          placeholder="Ara..."  
          value={searchText}  
          onChangeText={setSearchText}  
        />  
        <View style={styles.filterButtons}>  
          <TouchableOpacity  
            style={[  
              styles.filterButton,  
              selectedFilter === 'all' && styles.filterButtonActive  
            ]}  
            onPress={() => setSelectedFilter('all')}  
          >  
            <Text>Tümü</Text>  
          </TouchableOpacity>  
          <TouchableOpacity  
            style={[  
              styles.filterButton,  
              selectedFilter === 'age' && styles.filterButtonActive  
            ]}  
            onPress={() => setSelectedFilter('age')}  
          >  
            <Text>Yaşa Göre</Text>  
          </TouchableOpacity>  
          <TouchableOpacity  
            style={[  
              styles.filterButton,  
              selectedFilter === 'name' && styles.filterButtonActive  
            ]}  
            onPress={() => setSelectedFilter('name')}  
          >  
            <Text>İsme Göre</Text>  
          </TouchableOpacity>  
        </View>  
      </View>  

      <FlatList  
        data={filterResults()}  
        renderItem={renderTestItem}  
        keyExtractor={keyExtractor} // Benzersiz key sağlayan keyExtractor  
        contentContainerStyle={styles.listContainer}  
      />  
    </View>  
  );  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: 'white',
    elevation: 2,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  filterButtonActive: {
    backgroundColor: '#0066cc',
  },
  listContainer: {
    padding: 10,
  },
  resultCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  testType: {
    fontWeight: '500',
    width: 80,
  },
  testValue: {
    marginRight: 10,
  },
  changeIndicator: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  testDate: {
    color: '#666',
    fontSize: 12,
    marginLeft: 'auto',
  },
  patientAge: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
});

export default LabResults;