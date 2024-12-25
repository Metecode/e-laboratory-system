import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import SelectDropdown from 'react-native-select-dropdown';

interface TestResult {
  id: string;
  value: number;
  unit: string;
  test_date: string;
  age: number;
}

interface UserTestResults {
  id: string;
  firstName: string;
  lastName: string;
  results: {
    [key: string]: TestResult[];
  };
  lastUpdated: string;
}

interface Reference {
  ageGroup: string;
  minValue: number;
  maxValue: number;
}

interface Guideline {
  category: string;
  name?: string;
  references: Reference[];
}

const LabResults = () => {
  const [testResults, setTestResults] = useState<UserTestResults[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserTestResults | null>(null);
  const [selectedGuideline, setSelectedGuideline] = useState<Guideline | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchTestResults();
    fetchGuidelines();
  }, []);

  const fetchTestResults = async () => {
    try {
      const snapshot = await firestore()
        .collection('test_results')
        .get();

      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserTestResults[];

      setTestResults(results);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      setLoading(false);
    }
  };

  const fetchGuidelines = async () => {
    try {
      const snapshot = await firestore()
        .collection('guidelines')
        .get();

      const guidelinesArray: Guideline[] = snapshot.docs.flatMap(doc => {
        const data = doc.data();
        return data.guidelines.map(guideline => ({
          name: guideline.name,
          category: guideline.category,
          references: guideline.references || []
        }));
      });

      setGuidelines(guidelinesArray);
    } catch (error) {
      console.error('Error fetching guidelines:', error);
    }
  };

  const getComparisonIndicator = (value: number, minValue: number, maxValue: number) => {
    if (value < minValue) return '↓';
    if (value > maxValue) return '↑';
    return '↔';
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
  
          // Referans değerini bul (16 yaş üstü için "+16" kontrolü)  
          const referenceValue = selectedGuideline?.references.find(ref => {  
            const ageGroups = ref.ageGroup.split('-').map(age => age.trim());  
            
            if (ageGroups[0] === '16+') {  
              return currentValue.age > 16;  
            }  
            
            if (ageGroups.length === 1) {  
              return currentValue.age === parseInt(ageGroups[0]);  
            } else if (ageGroups.length === 2) {  
              return currentValue.age >= parseInt(ageGroups[0]) &&   
                     currentValue.age <= parseInt(ageGroups[1]);  
            }  
            
            return false;  
          });  
  
          return (  
            <View key={`${item.id}-${testType}`} style={styles.testRow}>  
              <Text style={styles.testType}>{testType}:</Text>  
  
              {/* Kılavuz Seçimi */}  
              <SelectDropdown  
                data={guidelines.map(g => g.category)}   
                onSelect={(selectedCategory) => {  
                  const selectedGuidelineData = guidelines.find(g => g.category === selectedCategory);  
                  setSelectedGuideline(selectedGuidelineData || null);  
                }}  
                renderButton={(selectedItem) => (  
                  <View style={styles.referenceDropdown}>  
                    <Text style={styles.referenceDropdownText}>  
                      {selectedItem || 'Kılavuz Seç'}  
                    </Text>  
                  </View>  
                )}  
                renderItem={(item, index, isSelected) => (  
                  <View style={[  
                    styles.referenceDropdownItem,  
                    isSelected && { backgroundColor: '#D2D9DF' }  
                  ]}>  
                    <Text>{item}</Text>  
                  </View>  
                )}  
              />  
  
              {/* Referans Değeri Gösterimi */}  
              {selectedGuideline && referenceValue && (  
                <Text style={styles.referenceRange}>  
                  {selectedGuideline.name} Referans Aralığı ({referenceValue.ageGroup} yaş):   
                  Min {referenceValue.minValue} - Max {referenceValue.maxValue}  
                </Text>  
              )}  
  
              <Text style={styles.testValue}>  
                {currentValue.value} {currentValue.unit}  
                <Text style={styles.changeIndicator}>  
                  {' '}{getComparisonIndicator(  
                    currentValue.value,  
                    referenceValue?.minValue || 0,  
                    referenceValue?.maxValue || 0  
                  )}  
                </Text>  
              </Text>  
  
              <Text style={styles.testDate}>{currentValue.test_date}</Text>  
              <Text style={styles.patientAge}>Yaş: {currentValue.age}</Text>  
            </View>  
          );  
        })}  
      </View>  
    );  
  };

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
          placeholder="Kullanıcı Ara..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <SelectDropdown
          data={testResults.filter(user =>
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchText.toLowerCase())
          )}
          onSelect={(selectedItem) => setSelectedUser(selectedItem)}
          renderButton={(selectedItem) => (
            <View style={styles.userDropdown}>
              <Text style={styles.userDropdownText}>
                {selectedItem
                  ? `${selectedItem.firstName} ${selectedItem.lastName}`
                  : 'Kullanıcı Seç'}
              </Text>
            </View>
          )}
          renderItem={(item, index, isSelected) => (
            <View style={[
              styles.userDropdownItem,
              isSelected && { backgroundColor: '#D2D9DF' }
            ]}>
              <Text>{item.firstName} {item.lastName}</Text>
            </View>
          )}
        />
      </View>

      <FlatList
        data={selectedUser ? [selectedUser] : testResults}
        renderItem={renderTestItem}
        keyExtractor={(item) => item.id}
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
  userDropdown: {
    margin: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  userDropdownText: {
    textAlign: 'center',
  },
  userDropdownItem: {
    padding: 10,
  },
  resultCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  testRow: {
    marginBottom: 10,
  },
  testType: {
    fontWeight: 'bold',
  },
  referenceDropdown: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    marginVertical: 5,
  },
  referenceDropdownText: {
    textAlign: 'center',
  },
  referenceDropdownItem: {
    padding: 10,
  },
  referenceRange: {
    color: '#666',
    marginVertical: 5,
  },
  testValue: {
    fontSize: 16,
  },
  changeIndicator: {
    fontWeight: 'bold',
    color: 'green',
  },
  testDate: {
    color: '#888',
  },
  patientAge: {
    color: '#888',
  },
  referenceRangeTitle: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default LabResults;