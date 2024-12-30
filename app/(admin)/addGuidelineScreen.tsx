import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';

const TEST_CATEGORIES = [
    'IgA', 'IgM', 'IgG',
    'IgG1', 'IgG2', 'IgG3', 'IgG4'
];

interface GuidelineReference {
    ageGroup: string;
    minValue: number;
    maxValue: number;
}

interface Guideline {
    name: string;
    category: string;
    references: GuidelineReference[];
}

const ageGroups = [
    '0-1', '1-2', '2-3', '4-5', '5-6',
    '6-7', '7-8', '9-10',
    '11-12', '13-14', '15-16', '16+'
];

export default function AddGuidelineScreen() {
    const [guidelineName, setGuidelineName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [referenceValues, setReferenceValues] = useState<{ [key: string]: { min: string; max: string } }>({});
    const [guidelines, setGuidelines] = useState<Guideline[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedGuideline, setSelectedGuideline] = useState<Guideline | null>(null);

    // Kılavuzları kategoriye göre yükle  
    const fetchGuidelines = async () => {
        if (!selectedCategory) return;

        try {
            const docRef = firestore().collection('guidelines').doc(selectedCategory);
            const doc = await docRef.get();

            if (doc.exists) {
                const data = doc.data() as { guidelines: Guideline[] };
                setGuidelines(data.guidelines || []);
            } else {
                setGuidelines([]);
            }
        } catch (error) {
            console.error('Kılavuzlar yüklenirken hata:', error);
            setGuidelines([]);
        }
    };

    useEffect(() => {
        if (selectedCategory) {
            fetchGuidelines();
        }
    }, [selectedCategory]);

    // Kılavuz kaydetme fonksiyonu  
    const saveGuideline = async () => {
        if (!selectedCategory) {
            Alert.alert('Hata', 'Lütfen önce bir test kategorisi seçiniz.');
            return;
        }

        if (!guidelineName) {
            Alert.alert('Hata', 'Lütfen kılavuz ismini giriniz.');
            return;
        }

        // Referans değerleri kontrolü  
        const references: GuidelineReference[] = [];

        for (const ageGroup of ageGroups) {
            const { min, max } = referenceValues[ageGroup] || { min: '', max: '' };
            if (!min || !max) {
                Alert.alert('Hata', `${ageGroup} için minimum ve maksimum referans değeri giriniz.`);
                return;
            }

            references.push({
                ageGroup,
                minValue: parseFloat(min),
                maxValue: parseFloat(max)
            });
        }

        try {
            const docRef = firestore().collection('guidelines').doc(selectedCategory);

            // Mevcut kılavuzları al  
            const doc = await docRef.get();
            const existingData = doc.exists ? doc.data() as { guidelines: Guideline[] } : { guidelines: [] };

            // Aynı isimli kılavuz varsa çıkar  
            const updatedGuidelines = existingData.guidelines
                .filter(g => g.name !== guidelineName)
                .concat({
                    name: guidelineName,
                    category: selectedCategory,
                    references: references
                });

            // Firestore'a kaydet  
            await docRef.set({ guidelines: updatedGuidelines }, { merge: true });

            Alert.alert('Başarılı', 'Kılavuz başarıyla kaydedildi.');
            setGuidelineName('');
            setReferenceValues({});
            setModalVisible(false);
            fetchGuidelines(); // Kılavuzları yeniden yükle  
        } catch (error) {
            console.error('Kılavuz kaydedilirken hata:', error);
            Alert.alert('Hata', 'Kılavuz kaydedilemedi.');
        }
    };

    // Kılavuz detaylarını görüntüleme  
    const showGuidelineDetails = (guideline: Guideline) => {
        setSelectedGuideline(guideline);
        setDetailModalVisible(true);
    };

    // Modal açma fonksiyonu  
    const openModal = () => {
        if (!selectedCategory) {
            Alert.alert('Uyarı', 'Lütfen önce bir test kategorisi seçiniz.');
            return;
        }
        setModalVisible(true);
    };
    // Sadece sayı, nokta ve virgül girişine izin veren fonksiyon  
    const validateNumericInput = (value: string) => {
        // Sadece 0-9, nokta ve virgül karakterlerine izin ver  
        return value.replace(/[^0-9.,]/g, '');
    };
    return (
        <ScrollView style={styles.container}>
            {/* Kılavuz Ekle Butonu */}
            <TouchableOpacity style={styles.addButton} onPress={openModal}>
                <Text style={styles.addButtonText}>Kılavuz Ekle</Text>
            </TouchableOpacity>

            {/* Test Kategorisi Seçimi */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Test Kategorisi</Text>
                <SelectDropdown
                    data={TEST_CATEGORIES}
                    onSelect={(selectedItem) => setSelectedCategory(selectedItem)}
                    renderButton={(selectedItem, isOpened) => (
                        <View style={styles.dropdownButton}>
                            <Text style={styles.dropdownButtonText}>
                                {selectedItem || 'Test Kategorisi Seçiniz'}
                            </Text>
                        </View>
                    )}
                    renderItem={(item, index, isSelected) => (
                        <View style={{
                            ...styles.dropdownItemStyle,
                            ...(isSelected && { backgroundColor: '#D2D9DF' })
                        }}>
                            <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    dropdownStyle={styles.dropdownMenuStyle}
                />
            </View>

            {/* Kılavuz Listesi */}
            <View style={styles.guidelineListContainer}>
                <Text style={styles.label}>Kılavuzlar</Text>
                {guidelines.length > 0 ? (
                    guidelines.map((guideline, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.guidelineItem}
                            onPress={() => showGuidelineDetails(guideline)}
                        >
                            <View style={styles.guidelineTextContainer}>
                                <Text style={styles.guidelineTitle}>
                                    {guideline.name}
                                    <Text style={styles.guidelineCategory}> ({guideline.category})</Text>
                                </Text>
                            </View>
                            <Icon name="chevron-forward" size={20} color="#6a0dad" />
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.noGuidelinesText}>
                        {!selectedCategory
                            ? 'Lütfen bir kategori seçiniz.'
                            : 'Bu kategori için kılavuz bulunmamaktadır.'}
                    </Text>
                )}
            </View>

            {/* Kılavuz Ekleme Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Kılavuz Ekle</Text>
                        <ScrollView style={styles.scrollView}>
                            <TextInput
                                style={styles.input}
                                value={guidelineName}
                                onChangeText={setGuidelineName}
                                placeholder="Kılavuz ismini giriniz"
                            />
                            <View style={styles.ageGroupContainer}>
                                {ageGroups.map((ageGroup) => (
                                    <View key={ageGroup} style={styles.ageGroupInput}>
                                        <Text style={styles.ageGroupLabel}>{ageGroup} Yaş</Text>
                                        <View style={styles.referenceInputContainer}>
                                            <TextInput
                                                style={styles.input}
                                                value={referenceValues[ageGroup]?.min}
                                                onChangeText={(value) => {
                                                    const sanitizedValue = validateNumericInput(value);
                                                    setReferenceValues({
                                                        ...referenceValues,
                                                        [ageGroup]: {
                                                            ...referenceValues[ageGroup],
                                                            min: sanitizedValue
                                                        }
                                                    });
                                                }}
                                                placeholder="Min Değer"
                                                keyboardType="decimal-pad"  // Daha esnek numeric input  
                                            />
                                            <TextInput
                                                style={styles.input}
                                                value={referenceValues[ageGroup]?.max}
                                                onChangeText={(value) => {
                                                    const sanitizedValue = validateNumericInput(value);
                                                    setReferenceValues({
                                                        ...referenceValues,
                                                        [ageGroup]: {
                                                            ...referenceValues[ageGroup],
                                                            max: sanitizedValue
                                                        }
                                                    });
                                                }}
                                                placeholder="Max Değer"
                                                keyboardType="decimal-pad"  // Daha esnek numeric input  
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.saveButton} onPress={saveGuideline}>
                                <Text style={styles.saveButtonText}>Kaydet</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButtonText}>Kapat</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Kılavuz Detay Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailModalVisible}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Kılavuz Detayları</Text>
                        {selectedGuideline && (
                            <ScrollView style={styles.detailContainer}>
                                <Text style={styles.detailHeaderText}>
                                    {selectedGuideline.name}
                                    <Text style={styles.detailCategoryText}> ({selectedGuideline.category})</Text>
                                </Text>
                                {selectedGuideline.references.map((ref, index) => (
                                    <View key={index} style={styles.referenceItem}>
                                        <Text style={styles.referenceAgeGroup}>{ref.ageGroup}</Text>
                                        <Text style={styles.referenceValue}>Min: {ref.minValue}, Max: {ref.maxValue}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                        <TouchableOpacity
                            style={styles.closeDetailButton}
                            onPress={() => setDetailModalVisible(false)}
                        >
                            <Text style={styles.closeDetailButtonText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        maxHeight: '80%', // Modal yüksekliğini sınırla  
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#6a0dad',
    },
    detailHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    detailCategoryText: {
        fontSize: 16,
        color: '#6a0dad',
        fontWeight: 'normal',
    },
    referenceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 5,
        marginVertical: 5,
    },
    referenceAgeGroup: {
        fontSize: 16,
        flex: 1,
    },
    referenceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6a0dad',
    },
    closeDetailButton: {
        backgroundColor: '#6a0dad',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    closeDetailButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    ageGroupContainer: {
        marginVertical: 10,
    },
    ageGroupInput: {
        marginBottom: 15,
    },
    referenceInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginVertical: 5,
        flex: 1,
        marginRight: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    saveButton: {
        backgroundColor: '#6a0dad',
        padding: 15,
        borderRadius: 10,
        flex: 1,
        marginRight: 10,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    closeButton: {
        backgroundColor: '#ccc',
        padding: 15,
        borderRadius: 10,
        flex: 1,
    },
    closeButtonText: {
        color: 'black',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    guidelineListContainer: {
        marginTop: 20,
    },
    guidelineItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginVertical: 5,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    guidelineTextContainer: {
        flex: 1,
    },
    guidelineTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    guidelineCategory: {
        fontSize: 14,
        color: '#6a0dad',
    },
    noGuidelinesText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6a0dad',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#6a0dad',
        marginBottom: 10,
    },
    dropdownButton: {
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#6a0dad',
    },
    rangeItem: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        marginVertical: 5,
    },
    addButton: {
        backgroundColor: '#6a0dad',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    ageGroupLabel: {
        fontSize: 16,
        color: '#6a0dad',
        marginBottom: 5,
    },
    scrollView: {
        width: '100%',
    },
    dropdownItemStyle: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    dropdownItemTxtStyle: {
        fontSize: 16,
        color: '#333',
    },
    dropdownMenuStyle: {
        backgroundColor: 'white',
        borderRadius: 10,
    },
    detailButton: {
        backgroundColor: '#6a0dad',
        padding: 10,
        borderRadius: 5,
    },
    detailContainer: {
        width: '100%',
        marginVertical: 20,
    },
    detailText: {
        fontSize: 16,
    },
    detailLabel: {
        fontWeight: 'bold',
        color: '#6a0dad',
    },
});