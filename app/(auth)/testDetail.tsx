import React, { useEffect, useState } from 'react';  
import { View, Text, StyleSheet, ScrollView } from 'react-native';  
import { useLocalSearchParams } from 'expo-router';  

interface TestResult {  
  id: string;  
  test_date: string;  
  value: number;  
  unit: string;  
  age: string;  
  reference_min?: number;  
  reference_max?: number;  
}  

export default function TestDetail() {  
  const { test_name, results } = useLocalSearchParams();  
  const [categoryResults, setCategoryResults] = useState<TestResult[]>([]);  

  useEffect(() => {  
    // results parametresini parse et  
    if (results) {  
      try {  
        const parsedResults = JSON.parse(results as string);  
        setCategoryResults(parsedResults);  
      } catch (error) {  
        console.error("Error parsing results:", error);  
      }  
    }  
  }, [results]);  

  const getResultStatus = (value: number, min?: number, max?: number) => {  
    if (!min || !max) return 'normal';  
    if (value < min) return 'low';  
    if (value > max) return 'high';  
    return 'normal';  
  };  

  const getStatusIcon = (status: string) => {  
    switch (status) {  
      case 'low':  
        return '↓';  
      case 'high':  
        return '↑';  
      default:  
        return '↔';  
    }  
  };  

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
        const status = getResultStatus(  
          result.value,  
          result.reference_min,  
          result.reference_max  
        );  
        return (  
          <View key={index} style={styles.resultContainer}>  
            <Text style={styles.dateText}>  
              Test Tarihi: {result.test_date}  
            </Text>  
            <View style={styles.valueContainer}>  
              <Text style={[  
                styles.valueText,  
                { color: getStatusColor(status) }  
              ]}>  
                {result.value} {result.unit} {getStatusIcon(status)}  
              </Text>  
            </View>  
            <Text style={styles.referenceText}>  
              Referans Aralığı: {result.reference_min} - {result.reference_max} {result.unit}  
            </Text>  
            <Text style={styles.ageText}>  
              Yaş: {result.age}  
            </Text>  
          </View>  
        );  
      })}  
    </ScrollView>  
  );  
}  

const styles = StyleSheet.create({  
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
  valueContainer: {  
    flexDirection: 'row',  
    alignItems: 'center',  
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
});