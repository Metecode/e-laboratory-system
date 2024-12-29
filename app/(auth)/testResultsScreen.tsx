import React, { useEffect, useState } from 'react';  
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';  
import firestore from '@react-native-firebase/firestore';  
import auth from '@react-native-firebase/auth';  
import { useRouter } from 'expo-router';  

interface Guideline {  
  name: string;  
  category: string;  
  references: {  
    ageGroup: string;  
    minValue: number;  
    maxValue: number;  
  }[];  
}  

interface TestResult {  
  id: string;  
  test_name: string;  
  test_date: string;  
  value: number;  
  unit: string;  
  age: string;  
}  

interface GroupedTestResult {  
  test_name: string;  
  test_date: string;  
  results: TestResult[];  
}  

export default function TestResultsScreen() {  
  const [testResults, setTestResults] = useState<GroupedTestResult[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [modalVisible, setModalVisible] = useState(false);  
  const [allTestResults, setAllTestResults] = useState<TestResult[]>([]);  
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);  
  const router = useRouter();  

  const renderItem = ({ item }: { item: GroupedTestResult }) => (  
    <TouchableOpacity  
      style={styles.resultCard}  
      onPress={() => router.push({  
        pathname: '/(auth)/testDetail',  
        params: {  
          test_name: item.test_name,  
          results: JSON.stringify(item.results)  
        }  
      })}  
    >  
      <Text style={styles.resultTitle}>{item.test_name || 'Tahlil Adı'}</Text>  
      <Text style={styles.resultDate}>{item.test_date || 'Tarih'}</Text>  
    </TouchableOpacity>  
  );  

  const fetchGuidelines = async () => {  
    try {  
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
    } catch (error) {  
      console.error('Kılavuz çekme hatası:', error);  
    }  
  };  

  const getReferenceValues = (result: TestResult) => {  
    const matchingGuideline = guidelines.find(guide =>   
      guide.category.toLowerCase() === result.test_name.toLowerCase()  
    );  

    if (!matchingGuideline) {  
      console.log('No matching guideline found for:', result.test_name);  
      return null;  
    }  

    const userAge = parseInt(result.age);  
    
    const matchingReference = matchingGuideline.references.find(ref => {  
      const [minAge, maxAge] = ref.ageGroup.split('-').map(age => {  
        if (age.includes('+')) {  
          return parseInt(age);  
        }  
        return parseInt(age);  
      });  

      if (maxAge === undefined && minAge + '+' === ref.ageGroup) {  
        return userAge >= minAge;  
      }  

      return userAge >= minAge && userAge <= maxAge;  
    });  

    if (!matchingReference) {  
      console.log('No matching reference found for age:', userAge);  
      return null;  
    }  

    return {  
      min: matchingReference.minValue,  
      max: matchingReference.maxValue  
    };  
  };  

  const getResultStatus = (result: TestResult) => {  
    const referenceValues = getReferenceValues(result);  
    
    if (!referenceValues) return 'normal';  
  
    if (result.value < referenceValues.min) return 'low';  
    if (result.value > referenceValues.max) return 'high';  
    
    return 'normal';  
  };   

  const getTrendIcon = (currentResult: TestResult, allResults: TestResult[]) => {  
    // Aynı test türündeki sonuçları tarihe göre sırala  
    const sameTypeResults = allResults  
      .filter(r => r.test_name === currentResult.test_name)  
      .sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());  
  
    // En yeni sonuç değilse trend gösterme  
    if (sameTypeResults[0].id !== currentResult.id) return '';  
  
    // En yeni sonuç ise, bir önceki sonuçla karşılaştır  
    if (sameTypeResults.length > 1) {  
      const previousResult = sameTypeResults[1]; // Bir önceki sonuç  
      
      if (currentResult.value > previousResult.value) {  
        return '↑'; // Artış  
      } else if (currentResult.value < previousResult.value) {  
        return '↓'; // Azalış  
      } else {  
        return '↔'; // Değişim yok  
      }  
    }  
  
    return ''; // Tek sonuç varsa trend gösterme  
  };   

  const fetchTestResults = async () => {  
    try {  
      await fetchGuidelines(); // Önce kılavuzları çek  

      const user = auth().currentUser;  
      if (user) {  
        const doc = await firestore()  
          .collection('test_results')  
          .doc(user.uid)  
          .get();  

        if (doc.exists) {  
          const data = doc.data();  
          const resultsMap: { [key: string]: GroupedTestResult } = {};  
          const allResults: TestResult[] = [];  

          // results nesnesini düzleştir  
          for (const [key, value] of Object.entries(data?.results || {})) {  
            (value as any[]).forEach((result: any) => {  
              const processedResult = {  
                id: result.id,  
                test_name: key,  
                test_date: result.test_date,  
                value: result.value,  
                unit: result.unit,  
                age: result.age  
              };  

              if (!resultsMap[key]) {  
                resultsMap[key] = {  
                  test_name: key,  
                  test_date: result.test_date,  
                  results: [],  
                };  
              }  
              resultsMap[key].results.push(processedResult);  
              allResults.push(processedResult);  
            });  
          }  

          setTestResults(Object.values(resultsMap));  
          setAllTestResults(allResults);  
        } else {  
          console.log("No test results found for this user");  
        }  
      }  
    } catch (error) {  
      console.error("Error fetching test results:", error);  
    } finally {  
      setLoading(false);  
    }  
  };  

  useEffect(() => {  
    fetchTestResults();  
  }, []);  

  const getStatusColor = (status: string) => {  
    switch (status) {  
      case 'low': return '#2196F3'; // Mavi  
      case 'high': return '#F44336'; // Kırmızı  
      default: return '#4CAF50'; // Yeşil  
    }  
  };  

  const renderAllTestResults = () => (  
    <ScrollView>  
      {Object.keys(  
        allTestResults.reduce((acc, result) => {  
          acc[result.test_name] = true;  
          return acc;  
        }, {})  
      ).map(testType => {  
        const testResults = allTestResults  
          .filter(result => result.test_name === testType)  
          .sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());  
  
        return (  
          <View key={testType} style={styles.testTypeContainer}>  
            <Text style={styles.testTypeTitle}>{testType} Sonuçları</Text>  
            {testResults.map((result, index) => {  
              const status = getResultStatus(result);  
              const trendIcon = getTrendIcon(result, allTestResults);  
              const isNewest = index === 0; // En yeni sonuç mu kontrol et  
  
              return (  
                <View key={result.id} style={[  
                  styles.resultItem,  
                  isNewest && styles.newestResult // En yeni sonuç için ekstra stil  
                ]}>  
                  <View>  
                    <Text style={styles.resultItemDate}>{result.test_date}</Text>  
                    {isNewest && <Text style={styles.newestLabel}>En Yeni</Text>}  
                  </View>  
                  <View style={styles.valueContainer}>  
                    <Text   
                      style={[  
                        styles.resultItemValue,   
                        { color: getStatusColor(status) }  
                      ]}  
                    >  
                      {result.value} {result.unit}  
                    </Text>  
                    {trendIcon && (  
                      <Text style={[  
                        styles.trendIcon,  
                        {   
                          color: trendIcon === '↑' ? '#F44336' :   
                                 trendIcon === '↓' ? '#2196F3' :   
                                 '#4CAF50'  
                        }  
                      ]}>  
                        {trendIcon}  
                      </Text>  
                    )}  
                  </View>  
                </View>  
              );  
            })}  
          </View>  
        );  
      })}  
    </ScrollView>  
  );

  if (loading) {  
    return (  
      <View style={styles.container}>  
        <Text>Yükleniyor...</Text>  
      </View>  
    );  
  }  

  return (  
    <View style={styles.container}>  
      <Text style={styles.title}>Tahlil Sonuçlarım</Text>  
      <FlatList  
        data={testResults}  
        renderItem={renderItem}  
        keyExtractor={(item) => item.test_name}  
        contentContainerStyle={styles.listContainer}  
      />  
      <TouchableOpacity   
        style={styles.allResultsButton}  
        onPress={() => setModalVisible(true)}  
      >  
        <Text style={styles.allResultsButtonText}>Tüm Tahlil Sonuçları</Text>  
      </TouchableOpacity>  

      <Modal  
        visible={modalVisible}  
        animationType="slide"  
        transparent={false}  
        onRequestClose={() => setModalVisible(false)}  
      >  
        <View style={styles.modalContainer}>  
          <TouchableOpacity   
            style={styles.closeButton}  
            onPress={() => setModalVisible(false)}  
          >  
            <Text style={styles.closeButtonText}>Kapat</Text>  
          </TouchableOpacity>  
          {renderAllTestResults()}  
        </View>  
      </Modal>  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  resultItem: {  
    backgroundColor: 'white',  
    padding: 15,  
    borderRadius: 8,  
    marginBottom: 8,  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
  },  
  newestResult: {  
    borderWidth: 2,  
    borderColor: '#6a0dad',  
    backgroundColor: '#fff',  
  },  
  newestLabel: {  
    fontSize: 12,  
    color: '#6a0dad',  
    marginTop: 4,  
  },  
  valueContainer: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    gap: 8,  
  },  
  resultItemValue: {  
    fontSize: 16,  
    fontWeight: 'bold',  
  },  
  trendIcon: {  
    fontSize: 20,  
    fontWeight: 'bold',  
  },  
  resultItemDate: {  
    fontSize: 14,  
    color: '#666',  
  },
  container: {  
    flex: 1,  
    padding: 20,  
    backgroundColor: '#f5f5f5',  
  },  
  title: {  
    fontSize: 24,  
    fontWeight: 'bold',  
    marginBottom: 20,  
    color: '#6a0dad',  
  },  
  listContainer: {  
    paddingBottom: 20,  
  },  
  resultCard: {  
    backgroundColor: 'white',  
    padding: 15,  
    borderRadius: 10,  
    marginBottom: 10,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  resultTitle: {  
    fontSize: 18,  
    fontWeight: 'bold',  
  },  
  resultDate: {  
    fontSize: 14,  
    color: 'gray',  
  },  
  allResultsButton: {  
    backgroundColor: '#6a0dad',  
    padding: 15,  
    borderRadius: 10,  
    alignItems: 'center',  
    marginTop: 10,  
  },  
  allResultsButtonText: {  
    color: 'white',  
    fontSize: 16,  
    fontWeight: 'bold',  
  },  
  modalContainer: {  
    flex: 1,  
    padding: 20,  
    backgroundColor: '#f5f5f5',  
  },  
  closeButton: {  
    alignSelf: 'flex-end',  
    padding: 10,  
  },  
  closeButtonText: {  
    color: '#6a0dad',  
    fontSize: 16,  
  },  
  testTypeContainer: {  
    marginBottom: 20,  
  },  
  testTypeTitle: {  
    fontSize: 20,  
    fontWeight: 'bold',  
    marginBottom: 10,  
    color: '#6a0dad',  
  },
});