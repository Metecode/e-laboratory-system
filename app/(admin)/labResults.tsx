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
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
// Her test türü için ayrı bir selectedGuideline tutacağız  
const [selectedGuidelines, setSelectedGuidelines] = useState<{  
  [testType: string]: Guideline | null;  
}>({});  

useEffect(() => {  
  const fetchData = async () => {  
    try {  
      // Guidelines'ı önce yükle  
      const guidelinesSnapshot = await firestore()  
        .collection('guidelines')  
        .get();  

      const guidelinesData = guidelinesSnapshot.docs.flatMap(doc => {  
        const data = doc.data();  
        return data.guidelines.map(guideline => ({  
          name: guideline.name,  
          category: guideline.category,  
          references: guideline.references || []  
        }));  
      });  

      setGuidelines(guidelinesData);  
      console.log('Loaded Guidelines:', guidelinesData);  

      // Sonra test sonuçlarını yükle  
      const resultsSnapshot = await firestore()  
        .collection('test_results')  
        .get();  

      const results = resultsSnapshot.docs.map(doc => ({  
        id: doc.id,  
        ...doc.data()  
      })) as UserTestResults[];  

      setTestResults(results);  
      setLoading(false);  
    } catch (error) {  
      console.error('Error fetching data:', error);  
      setLoading(false);  
    }  
  };  

  fetchData();  
}, []);  

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
          const sortedValues = [...values].sort((a, b) => {  
            const parseDateTime = (dateTimeString: string) => {  
              const [datePart, timePart] = dateTimeString.split(' ');  
              const [day, month, year] = datePart.split('.');  
              const [hours = '0', minutes = '0'] = (timePart || '00:00').split(':');  
              
              return new Date(  
                parseInt(year),   
                parseInt(month) - 1,   
                parseInt(day),   
                parseInt(hours),   
                parseInt(minutes)  
              );  
            };  
          
            const dateA = parseDateTime(a.test_date);  
            const dateB = parseDateTime(b.test_date);  
          
            return dateB.getTime() - dateA.getTime();  
          });   
  
          const currentValue = sortedValues[0];  
  
          // Debug için konsola yazdıralım  
          console.log('Test Type:', testType);  
          console.log('Available Guidelines:', guidelines);  
          console.log('Selected Guidelines:', selectedGuidelines);  
  
          return (  
            <View key={`${item.id}-${testType}`} style={styles.testRow}>  
              <Text style={styles.testType}>{testType}:</Text>  
  
              <SelectDropdown  
                data={guidelines}  
                defaultValue={selectedGuidelines[testType]}  
                defaultButtonText="Kılavuz Seç"  
                onSelect={(selectedGuideline) => {  
                  console.log('Selected Guideline:', selectedGuideline);  
                  setSelectedGuidelines(prev => {  
                    const newState = {  
                      ...prev,  
                      [testType]: selectedGuideline  
                    };  
                    console.log('New Selected Guidelines State:', newState);  
                    return newState;  
                  });  
                }}  
                buttonTextAfterSelection={(selectedItem) => {  
                  return selectedItem.name || selectedItem.category;  
                }}  
                rowTextForSelection={(item) => {  
                  return item.name || item.category;  
                }}  
                renderButton={(selectedItem) => (  
                  <View style={styles.referenceDropdown}>  
                    <Text style={styles.referenceDropdownText}>  
                      {selectedItem ? (selectedItem.name || selectedItem.category) : 'Kılavuz Seç'}  
                    </Text>  
                  </View>  
                )}  
                renderItem={(item, index, isSelected) => (  
                  <View style={[  
                    styles.referenceDropdownItem,  
                    isSelected && { backgroundColor: '#D2D9DF' }  
                  ]}>  
                    <Text>{item.name || item.category}</Text>  
                  </View>  
                )}  
              />  
  
              {selectedGuidelines[testType] && (  
                <View>  
                  {/* Referans değerlerini göster */}  
                  {selectedGuidelines[testType]?.references  
                    .filter(ref => {  
                      const ageGroups = ref.ageGroup.split('-').map(age => age.trim());  
                      if (ageGroups[0] === '16+') {  
                        return currentValue.age > 16;  
                      }  
                      if (ageGroups.length === 1) {  
                        return currentValue.age === parseInt(ageGroups[0]);  
                      }  
                      return currentValue.age >= parseInt(ageGroups[0]) &&  
                             currentValue.age <= parseInt(ageGroups[1]);  
                    })  
                    .map((referenceValue, index) => (  
                      <Text key={index} style={styles.referenceRange}>  
                        {selectedGuidelines[testType]?.name || selectedGuidelines[testType]?.category}   
                        Referans Aralığı ({referenceValue.ageGroup} yaş):  
                        Min {referenceValue.minValue} - Max {referenceValue.maxValue}  
                      </Text>  
                    ))  
                  }  
                </View>  
              )}  
  
              {/* Güncel Test Değeri */}  
              <View style={styles.currentTestContainer}>  
                <Text style={styles.testValue}>  
                  {currentValue.value} {currentValue.unit}  
                  {selectedGuidelines[testType]?.references && (  
                    <Text style={styles.changeIndicator}>  
                      {' '}{getComparisonIndicator(  
                        currentValue.value,  
                        selectedGuidelines[testType]?.references[0]?.minValue || 0,  
                        selectedGuidelines[testType]?.references[0]?.maxValue || 0  
                      )}  
                    </Text>  
                  )}  
                </Text>  
  
                <Text style={styles.testDate}>{currentValue.test_date}</Text>  
                <Text style={styles.patientAge}>Yaş: {currentValue.age}</Text>  
              </View>  
  
              {/* Geçmiş Tahliller */}  
              <View style={styles.historicalTestsContainer}>  
                <Text style={styles.historicalTestsTitle}>Geçmiş Tahliller:</Text>  
                {sortedValues.slice(1).map((historicalValue, index) => (  
                  <View key={`historical-${index}`} style={styles.historicalTestItem}>  
                    <Text style={styles.historicalTestValue}>  
                      {historicalValue.value} {historicalValue.unit}  
                    </Text>  
                    <Text style={styles.historicalTestDate}>  
                      {historicalValue.test_date}  
                    </Text>  
                    <Text style={styles.historicalTestAge}>  
                      Yaş: {historicalValue.age}  
                    </Text>  
                  </View>  
                ))}  
              </View>  
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
  currentTestContainer: {  
    backgroundColor: '#f0f0f0',  
    padding: 10,  
    borderRadius: 8,  
    marginBottom: 10,  
  },  
  historicalTestsContainer: {  
    backgroundColor: '#f9f9f9',  
    padding: 10,  
    borderRadius: 8,  
  },  
  historicalTestsTitle: {  
    fontWeight: 'bold',  
    marginBottom: 5,  
    color: '#333',  
  },  
  historicalTestItem: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    paddingVertical: 5,  
    borderBottomWidth: 1,  
    borderBottomColor: '#e0e0e0',  
  },  
  historicalTestValue: {  
    fontSize: 14,  
  },  
  historicalTestDate: {  
    fontSize: 12,  
    color: '#666',  
  },  
  historicalTestAge: {  
    fontSize: 12,  
    color: '#666',  
  },  
});
//deneme
export default LabResults;