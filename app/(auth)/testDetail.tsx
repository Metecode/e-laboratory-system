import React, { useEffect, useState } from 'react';  
import { View, Text, StyleSheet, ScrollView } from 'react-native';  
import { useLocalSearchParams } from 'expo-router';  
import firestore from '@react-native-firebase/firestore';  

interface TestResult {  
  id: string;  
  test_date: string;  
  value: number;  
  unit: string;  
  age: string;  
}  

interface Guideline {  
  name: string;  
  category: string;  
  references: {  
    age_min: number;  
    age_max: number;  
    gender?: string;  
    min: number;  
    max: number;  
  }[];  
}  

export default function TestDetail() {  
  const { test_name, results } = useLocalSearchParams();  
  const [categoryResults, setCategoryResults] = useState<TestResult[]>([]);  
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);  

  const fetchGuidelines = async () => {  
    try {  
      const guidelinesSnapshot = await firestore()  
        .collection('guidelines')  
        .get();  
  
      const guidelinesData = guidelinesSnapshot.docs.flatMap(doc => {  
        const data = doc.data();  
        return data.guidelines.map(guideline => {  
          return {  
            name: guideline.name,  
            category: guideline.category,  
            references: guideline.references || []  
          };  
        });  
      });  
  
      setGuidelines(guidelinesData);  
    } catch (error) {  
      console.error('Kılavuz çekme hatası:', error);  
    }  
  };  

  const getResultStatus = (result: TestResult) => {  
    const referenceValues = getReferenceValues(result);  
    
    if (!referenceValues) return 'normal';  
  
    if (result.value < referenceValues.min) return 'low';  
    if (result.value > referenceValues.max) return 'high';  
    
    return 'normal';  
  }; 

  const getReferenceValues = (result: TestResult) => {  
  // Test adına göre uygun kılavuzu bul  
  const matchingGuideline = guidelines.find(guide =>   
    guide.category.toLowerCase() === test_name?.toLowerCase()  
  );  

  if (!matchingGuideline) {
    return null;  
  }  

  // Yaş için uygun referansı bul  
  const userAge = parseInt(result.age);  
  
  const matchingReference = matchingGuideline.references.find(ref => {  
    const [minAge, maxAge] = ref.ageGroup.split('-').map(age => {  
      // 16+ gibi durumları kontrol et  
      if (age.includes('+')) {  
        return parseInt(age);  
      }  
      return parseInt(age);  
    });  

    if (maxAge === undefined && minAge + '+' === ref.ageGroup) {  
      // 16+ gibi durumlar için  
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

  useEffect(() => {  
    fetchGuidelines();  

    if (results) {  
      try {  
        const parsedResults = JSON.parse(results as string);  
        // Test adına göre sonuçları al (örn: IgA sonuçları)  
        const testResults = parsedResults[test_name as string] || [];  
        
        // Sonuçları tarihe göre sırala  
        const sortedResults = Object.values(testResults)  
          .map((result: any) => ({  
            id: result.id,  
            test_date: result.test_date,  
            value: result.value,  
            unit: result.unit,  
            age: result.age  
          }))  
          .sort((a: TestResult, b: TestResult) =>   
            new Date(b.test_date).getTime() - new Date(a.test_date).getTime()  
          );  

        setCategoryResults(sortedResults);  
      } catch (error) {  
        console.error("Error parsing results:", error);  
      }  
    }  
  }, [results, test_name]);  

  const getStatusColor = (status: string) => {  
    switch (status) {  
      case 'low':  
        return '#2196F3'; // Mavi  
      case 'high':  
        return '#F44336'; // Kırmızı  
      default:  
        return '#4CAF50'; // Yeşil  
    }  
  };  

  const getTrendIcon = (currentResult: TestResult, index: number) => {  
    if (index === categoryResults.length - 1) return '';  
  
    const nextResult = categoryResults[index + 1];  
    
    if (currentResult.value > nextResult.value) {  
      return '↑'; // Artış  
    } else if (currentResult.value < nextResult.value) {  
      return '↓'; // Azalış  
    } else {  
      return '↔'; // Değişim yok  
    }  
  }; 

  useEffect(() => {  
    // Kılavuzları çek  
    fetchGuidelines();  

    if (results) {  
      try {  
        const parsedResults = JSON.parse(results as string);  
        const sortedResults = parsedResults.sort((a: TestResult, b: TestResult) =>   
          new Date(b.test_date).getTime() - new Date(a.test_date).getTime()  
        );  
        setCategoryResults(sortedResults);  
      } catch (error) {  
        console.error("Error parsing results:", error);  
      }  
    }  
  }, [results]);  

  if (!categoryResults || categoryResults.length === 0) {  
    return (  
      <View style={styles.container}>  
        <Text>Tahlil sonuçları bulunamadı.</Text>  
      </View>  
    );  
  }   

  return (  
    <ScrollView style={styles.container}>  
      <Text style={styles.title}>{test_name} Tahlil Geçmişi</Text>  
      {categoryResults.map((result, index) => {  
        const referenceValues = getReferenceValues(result);  
        const status = getResultStatus(result);  
        const trendIcon = getTrendIcon(result, index);  
    
        return (  
          <View key={result.id} style={styles.resultContainer}>  
            <Text style={styles.dateText}>  
              Test Tarihi: {result.test_date}  
            </Text>  
            <View style={styles.valueContainer}>  
              <Text style={[  
                styles.valueText,  
                { color: getStatusColor(status) }  
              ]}>  
                {result.value} {result.unit}  
              </Text>  
              {trendIcon && (  
                <Text style={[  
                  styles.trendIcon,  
                  {   
                    color: trendIcon === '↑' ? '#F44336' :   
                           trendIcon === '↓' ? '#2196F3' : '#4CAF50'  
                  }  
                ]}>  
                  {trendIcon}  
                </Text>  
              )}  
            </View>  
            {referenceValues && (  
              <Text style={styles.referenceText}>  
                Referans Aralığı: {referenceValues.min} - {referenceValues.max} {result.unit}  
              </Text>  
            )}  
            <Text style={styles.ageText}>  
              Yaş: {result.age}  
            </Text>  
            {status === 'normal' && (  
              <Text style={[  
                styles.warningText,  
                { color: '#4CAF50' } // Normal seviyede yeşil renk  
              ]}>  
                Normal Seviye  
              </Text>  
            )}  
            {status === 'low' && (  
              <Text style={[  
                styles.warningText,  
                { color: '#2196F3' }  
              ]}>  
                Düşük Seviye  
              </Text>  
            )}  
            {status === 'high' && (  
              <Text style={[  
                styles.warningText,  
                { color: '#F44336' }  
              ]}>  
                Yüksek Seviye  
              </Text>  
            )}  
          </View>  
        );  
      })}  
    </ScrollView>  
  );  
}
const styles = StyleSheet.create({  
  trendIcon: {  
    fontSize: 20,  
    fontWeight: 'bold',  
    marginLeft: 8,  
    alignSelf: 'center'  
  },  
  valueContainer: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    marginBottom: 8,  
    justifyContent: 'space-between' // İkonu sağa hizalar  
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
    textAlign: 'center',  
  },  
  resultContainer: {  
    marginBottom: 15,  
    padding: 15,  
    backgroundColor: 'white',  
    borderRadius: 10,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  dateText: {  
    fontSize: 16,  
    color: '#666',  
    marginBottom: 8,  
  }, 
  valueText: {  
    fontSize: 20,  
    fontWeight: 'bold',  
  },  
  referenceText: {  
    fontSize: 14,  
    color: '#666',  
    marginBottom: 4,  
  },  
  ageText: {  
    fontSize: 14,  
    color: '#666',  
  },  
  warningText: {  
    marginTop: 8,  
    fontSize: 14,  
    fontWeight: 'bold',  
    textAlign: 'center',  
  },  
});