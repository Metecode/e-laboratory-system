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

  const [filteredUsers, setFilteredUsers] = useState<UserTestResults[]>(testResults);

  // searchText değiştiğinde filtreleme yapan useEffect  
  useEffect(() => {
    if (searchText) {
      const filtered = testResults.filter(user =>
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(testResults);
    }
  }, [searchText, testResults]);

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

  // Önceki değerle karşılaştırma yapan fonksiyon  
  const getComparisonIndicator = (currentValue: number, previousValue: number | null) => {
    if (previousValue === null) return ''; // İlk değer için gösterge yok  

    const difference = ((currentValue - previousValue) / previousValue) * 100;
    const threshold = 1; // %1'lik değişim eşiği  

    if (Math.abs(difference) <= threshold) return '↔'; // Değişim %1 veya daha az ise aynı  
    if (difference > threshold) return '↑';  // Artış  
    return '↓';  // Azalış  
  };

  // Yaş grubuna göre referans değerini bulan fonksiyon  
  const findReferenceForAge = (age: number, guidelines: Reference[]) => {
    return guidelines.find(ref => {
      const ageRange = ref.ageGroup.split('-');
      if (ageRange[0] === '16+') {
        return age >= 16;
      }
      if (ageRange.length === 1) {
        return age === parseInt(ageRange[0]);
      }
      const [min, max] = ageRange.map(Number);
      return age >= min && age <= max;
    });
  };

  // Değerin referans aralığında olup olmadığını kontrol eden fonksiyon  
  const checkReferenceStatus = (value: number, age: number, guideline: Guideline | null) => {
    if (!guideline?.references) return null;

    const reference = findReferenceForAge(age, guideline.references);
    if (!reference) return null;

    const isOutOfRange = value < reference.minValue || value > reference.maxValue;

    return {
      isOutOfRange,
      indicator: getComparisonIndicator(value, reference.minValue, reference.maxValue),
      text: isOutOfRange ? 'Referans Dışı' : 'Normal',
      color: isOutOfRange ? '#ff0000' : '#008000',
      reference: reference
    };
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
          const currentGuideline = selectedGuidelines[testType];

          return (
            <View key={`${item.id}-${testType}`} style={styles.testRow}>
              <Text style={styles.testType}>{testType}:</Text>

              <SelectDropdown
                data={guidelines}
                defaultValue={currentGuideline}
                defaultButtonText="Kılavuz Seç"
                onSelect={(selectedGuideline) => {
                  setSelectedGuidelines(prev => ({
                    ...prev,
                    [testType]: selectedGuideline
                  }));
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

              {currentGuideline && (
                <View>
                  {/* Referans Aralığı Gösterimi */}
                  {(() => {
                    const reference = findReferenceForAge(currentValue.age, currentGuideline.references);
                    if (reference) {
                      return (
                        <Text style={styles.referenceRange}>
                          {currentGuideline.name} Referans Aralığı ({reference.ageGroup} yaş):
                          Min {reference.minValue} - Max {reference.maxValue}
                        </Text>
                      );
                    }
                    return null;
                  })()}
                </View>
              )}

              {/* Güncel Test Değeri */}
              {/* Güncel Test Değeri */}
              <View style={styles.currentTestContainer}>
                <Text style={styles.testValue}>
                  {currentValue.value} {currentValue.unit}
                  {(() => {
                    const previousValue = sortedValues[1]?.value || null;
                    const indicator = getComparisonIndicator(currentValue.value, previousValue);
                    const status = checkReferenceStatus(currentValue.value, currentValue.age, currentGuideline);

                    return (
                      <>
                        {indicator && (
                          <Text style={[
                            styles.changeIndicator,
                            {
                              color: indicator === '↑' ? '#ff0000' :
                                indicator === '↓' ? '#0000ff' :
                                  '#008000'
                            }
                          ]}> {indicator}</Text>
                        )}
                        {status && (
                          <Text style={[styles.resultStatus, { color: status.color }]}>
                            {' '}({status.text})
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </Text>
                <Text style={styles.testDate}>{currentValue.test_date}</Text>
                <Text style={styles.patientAge}>Yaş: {currentValue.age}</Text>
              </View>

              {/* Geçmiş Tahliller */}
              {sortedValues.slice(1).map((historicalValue, index) => {
                const status = checkReferenceStatus(historicalValue.value, historicalValue.age, currentGuideline);
                const historicalReference = currentGuideline?.references ?
                  findReferenceForAge(historicalValue.age, currentGuideline.references) : null;

                // Bir sonraki değer (zaman olarak daha eski olan)  
                const nextValue = sortedValues[index + 2]?.value || null;
                const indicator = getComparisonIndicator(historicalValue.value, nextValue);

                return (
                  <View key={`historical-${index}`} style={styles.historicalTestItem}>
                    {/* Referans Aralığı Gösterimi */}
                    {historicalReference && (
                      <Text style={styles.historicalReferenceRange}>
                        Referans Aralığı ({historicalReference.ageGroup} yaş):
                        Min {historicalReference.minValue} - Max {historicalReference.maxValue}
                      </Text>
                    )}

                    {/* Test Değeri ve Sonuç */}
                    <Text style={styles.historicalTestValue}>
                      {historicalValue.value} {historicalValue.unit}
                      {indicator && (
                        <Text style={[
                          styles.changeIndicator,
                          {
                            color: indicator === '↑' ? '#ff0000' :
                              indicator === '↓' ? '#0000ff' :
                                '#008000'
                          }
                        ]}> {indicator}</Text>
                      )}
                      {status && (
                        <Text style={[styles.resultStatus, { color: status.color }]}>
                          {' '}({status.text})
                        </Text>
                      )}
                    </Text>

                    <View style={styles.historicalMetadata}>
                      <Text style={styles.historicalTestDate}>
                        {historicalValue.test_date}
                      </Text>
                      <Text style={styles.historicalTestAge}>
                        Yaş: {historicalValue.age}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })
        }
      </View >
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
          data={filteredUsers}
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
          buttonTextAfterSelection={(selectedItem) =>
            `${selectedItem.firstName} ${selectedItem.lastName}`
          }
          rowTextForSelection={(item) =>
            `${item.firstName} ${item.lastName}`
          }
        />
      </View>

      <FlatList
        data={selectedUser ? [selectedUser] : filteredUsers}
        renderItem={renderTestItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText
                ? "Kullanıcı bulunamadı"
                : "Henüz test sonucu yok"}
            </Text>
          </View>
        )}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
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
  historicalTestItem: {
    flexDirection: 'column',
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  historicalReferenceRange: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  historicalTestValue: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  historicalMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  historicalTestDate: {
    fontSize: 12,
    color: '#666',
  },
  historicalTestAge: {
    fontSize: 12,
    color: '#666',
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
  resultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
//deneme
export default LabResults;