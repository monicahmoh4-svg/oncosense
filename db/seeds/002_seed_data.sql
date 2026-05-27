-- OncoSense Seed Data — Kenya countrywide clinics

-- Demo users
INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name, is_active, is_verified)
VALUES ('a0000000-0000-0000-0000-000000000001','admin@oncosense.health','+254700000001','$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','admin','System','Administrator',true,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name, is_active, is_verified)
VALUES ('a0000000-0000-0000-0000-000000000002','dr.amina@oncosense.health','+254700000002','$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','clinician','Dr. Amina','Hassan',true,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name, is_active, is_verified)
VALUES ('a0000000-0000-0000-0000-000000000003','chw.john@oncosense.health','+254700000003','$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','health_worker','John','Mwangi',true,true)
ON CONFLICT (id) DO NOTHING;

-- Kenya countrywide clinics — all 47 counties
INSERT INTO clinics (name, type, address, country, region, district, latitude, longitude, phone, services, resource_level) VALUES

-- NAIROBI COUNTY
('Kenyatta National Hospital','hospital','Hospital Road, Upper Hill, Nairobi','Kenya','Nairobi','Nairobi Central',-1.3006,36.8076,'+254202726300',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy','radiotherapy'],'high'),
('Nairobi Hospital','hospital','Argwings Kodhek Road, Nairobi','Kenya','Nairobi','Hurlingham',-1.2979,36.8132,'+254203845000',ARRAY['cervical_screening','mammography','oncology','pathology','mri','pet_scan'],'high'),
('Aga Khan University Hospital','hospital','3rd Parklands Avenue, Nairobi','Kenya','Nairobi','Parklands',-1.2618,36.8177,'+254203662000',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy','radiotherapy'],'high'),
('Karen Hospital','hospital','Karen Road, Karen, Nairobi','Kenya','Nairobi','Karen',-1.3166,36.7173,'+254709876000',ARRAY['cervical_screening','mammography','oncology','pathology','mri'],'high'),
('MP Shah Hospital','hospital','Shivachi Road, Parklands, Nairobi','Kenya','Nairobi','Parklands',-1.2605,36.8206,'+254203748000',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Gertrudes Childrens Hospital','hospital','Muthaiga Road, Nairobi','Kenya','Nairobi','Muthaiga',-1.2596,36.8319,'+254203763000',ARRAY['pediatric_oncology','pathology'],'high'),
('Mbagathi County Hospital','hospital','Mbagathi Way, Nairobi','Kenya','Nairobi','Langata',-1.3167,36.7833,'+254202002555',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Pumwani Maternity Hospital','hospital','Eastleigh North, Nairobi','Kenya','Nairobi','Pumwani',-1.2741,36.8519,'+254202119000',ARRAY['cervical_screening','reproductive_health'],'medium'),
('Mama Lucy Kibaki Hospital','hospital','Outer Ring Road, Nairobi','Kenya','Nairobi','Embakasi',-1.2797,36.8936,'+254202611711',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Mutuini Community Health Centre','health_center','Mutuini, Kawangware, Nairobi','Kenya','Nairobi','Dagoretti',-1.2911,36.7522,'+254700000101',ARRAY['cervical_screening','via_screening'],'low'),

-- MOMBASA COUNTY
('Coast General Teaching & Referral Hospital','hospital','Mombasa Road, Mombasa','Kenya','Mombasa','Mombasa Island',-4.0435,39.6682,'+254412312191',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy'],'high'),
('Aga Khan Hospital Mombasa','hospital','Vanga Road, Mombasa','Kenya','Mombasa','Mombasa Island',-4.0621,39.6641,'+254412227710',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Mombasa County Referral Hospital','hospital','Mama Ngina Drive, Mombasa','Kenya','Mombasa','Mombasa Island',-4.0659,39.6682,'+254412222060',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Port Reitz Sub-County Hospital','hospital','Port Reitz, Mombasa','Kenya','Mombasa','Changamwe',-4.0228,39.5936,'+254412229000',ARRAY['cervical_screening'],'medium'),
('Likoni Sub-County Hospital','hospital','Likoni, Mombasa','Kenya','Mombasa','Likoni',-4.0825,39.6648,'+254412450000',ARRAY['cervical_screening','via_screening'],'low'),

-- KISUMU COUNTY
('Jaramogi Oginga Odinga Teaching & Referral Hospital','hospital','Kakamega Road, Kisumu','Kenya','Kisumu','Kisumu Central',-0.1022,34.7617,'+254572022777',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy'],'high'),
('Aga Khan Hospital Kisumu','hospital','Otieno Oyoo Street, Kisumu','Kenya','Kisumu','Kisumu Central',-0.0956,34.7603,'+254572026401',ARRAY['cervical_screening','mammography','oncology'],'high'),
('Kisumu County Referral Hospital','hospital','Oginga Odinga Road, Kisumu','Kenya','Kisumu','Kisumu East',-0.0920,34.7571,'+254572023671',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Kisumu District Hospital','hospital','Obote Road, Kisumu','Kenya','Kisumu','Kisumu West',-0.1024,34.7518,'+254572020490',ARRAY['cervical_screening','via_screening'],'medium'),

-- NAKURU COUNTY
('Nakuru Level 5 Hospital','hospital','Nakuru-Eldoret Road, Nakuru','Kenya','Nakuru','Nakuru Town',-0.3031,36.0800,'+254512211111',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('War Memorial Hospital Nakuru','hospital','Kenyatta Avenue, Nakuru','Kenya','Nakuru','Nakuru Town',-0.2842,36.0654,'+254512212345',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Naivasha County Referral Hospital','hospital','Naivasha-Nakuru Road, Naivasha','Kenya','Nakuru','Naivasha',-0.7168,36.4328,'+254505020100',ARRAY['cervical_screening','via_screening'],'medium'),
('Gilgil Sub-County Hospital','hospital','Gilgil Town, Gilgil','Kenya','Nakuru','Gilgil',-0.5067,36.3183,'+254510020200',ARRAY['cervical_screening'],'low'),

-- KIAMBU COUNTY
('Thika Level 5 Hospital','hospital','Thika-Garissa Road, Thika','Kenya','Kiambu','Thika',-1.0332,37.0693,'+254672022222',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Kiambu County Referral Hospital','hospital','Hospital Road, Kiambu','Kenya','Kiambu','Kiambu Town',-1.1713,36.8354,'+254662020400',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Gatundu County Referral Hospital','hospital','Gatundu Town, Gatundu','Kenya','Kiambu','Gatundu',-0.9978,36.9133,'+254713444000',ARRAY['cervical_screening','via_screening'],'medium'),
('Limuru Sub-County Hospital','hospital','Limuru Town, Limuru','Kenya','Kiambu','Limuru',-1.1142,36.6423,'+254722000000',ARRAY['cervical_screening'],'low'),

-- MACHAKOS COUNTY
('Machakos Level 5 Hospital','hospital','Nairobi Road, Machakos','Kenya','Machakos','Machakos Town',-1.5177,37.2634,'+254452021222',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Matuu Sub-County Hospital','hospital','Matuu Town, Matuu','Kenya','Machakos','Yatta',-1.1726,37.4878,'+254452023000',ARRAY['cervical_screening','via_screening'],'low'),
('Kangundo County Referral Hospital','hospital','Kangundo Town, Kangundo','Kenya','Machakos','Kangundo',-1.4032,37.3488,'+254720000001',ARRAY['cervical_screening'],'low'),

-- MERU COUNTY
('Meru Teaching & Referral Hospital','hospital','Hospital Road, Meru','Kenya','Meru','Meru Town',0.0442,37.6509,'+254642030500',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Nkubu Sub-County Hospital','hospital','Nkubu Town, Nkubu','Kenya','Meru','Imenti South',0.0033,37.6311,'+254727000001',ARRAY['cervical_screening','via_screening'],'medium'),

-- UASIN GISHU COUNTY
('Moi Teaching & Referral Hospital','hospital','Nandi Road, Eldoret','Kenya','Uasin Gishu','Eldoret',0.5143,35.2698,'+254537773000',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy','radiotherapy'],'high'),
('Eldoret Wagon Hospital','hospital','Uganda Road, Eldoret','Kenya','Uasin Gishu','Eldoret',0.5188,35.2841,'+254534633155',ARRAY['cervical_screening','mammography','oncology'],'high'),
('Turbo Sub-County Hospital','hospital','Turbo Town, Turbo','Kenya','Uasin Gishu','Turbo',0.6248,35.0394,'+254720000002',ARRAY['cervical_screening'],'low'),

-- KAKAMEGA COUNTY
('Kakamega Teaching & Referral Hospital','hospital','Hospital Road, Kakamega','Kenya','Kakamega','Kakamega Town',0.2833,34.7500,'+254563020000',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Malava County Referral Hospital','hospital','Malava Town, Malava','Kenya','Kakamega','Malava',0.3667,34.8667,'+254563030000',ARRAY['cervical_screening','via_screening'],'medium'),

-- BUNGOMA COUNTY
('Bungoma County Referral Hospital','hospital','Hospital Road, Bungoma','Kenya','Bungoma','Bungoma Town',0.5635,34.5606,'+254553020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Webuye County Hospital','hospital','Webuye Town, Webuye','Kenya','Bungoma','Webuye',0.6167,34.7667,'+254553031000',ARRAY['cervical_screening','via_screening'],'medium'),
('Kimilili Sub-County Hospital','hospital','Kimilili Town, Kimilili','Kenya','Bungoma','Kimilili',0.7833,34.7167,'+254720000003',ARRAY['cervical_screening'],'low'),

-- KILIFI COUNTY
('Kilifi County Hospital','hospital','Kilifi Town, Kilifi','Kenya','Kilifi','Kilifi Town',-3.6300,39.8500,'+254412522500',ARRAY['cervical_screening','mammography','basic_oncology','pathology'],'high'),
('Malindi County Referral Hospital','hospital','Malindi Town, Malindi','Kenya','Kilifi','Malindi',-3.2187,40.1169,'+254422030200',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Watamu Sub-District Hospital','hospital','Watamu Town, Watamu','Kenya','Kilifi','Watamu',-3.3667,40.0167,'+254720000004',ARRAY['cervical_screening'],'low'),

-- KWALE COUNTY
('Kwale County Referral Hospital','hospital','Kwale Town, Kwale','Kenya','Kwale','Kwale Town',-4.1739,39.4522,'+254409820125',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Msambweni County Referral Hospital','hospital','Msambweni Town, Msambweni','Kenya','Kwale','Msambweni',-4.4667,39.4833,'+254409830000',ARRAY['cervical_screening','via_screening'],'medium'),

-- KISII COUNTY
('Kisii Teaching & Referral Hospital','hospital','Hospital Road, Kisii','Kenya','Kisii','Kisii Town',-0.6817,34.7667,'+254583020000',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Ogembo Sub-County Hospital','hospital','Ogembo Town, Ogembo','Kenya','Kisii','Kitutu Masaba',-0.7833,34.8833,'+254583030000',ARRAY['cervical_screening','via_screening'],'medium'),

-- NYAMIRA COUNTY
('Nyamira County Referral Hospital','hospital','Hospital Road, Nyamira','Kenya','Nyamira','Nyamira Town',-0.5667,34.9333,'+254589020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Keroka Sub-County Hospital','hospital','Keroka Town, Keroka','Kenya','Nyamira','Masaba South',-0.7000,34.9667,'+254720000005',ARRAY['cervical_screening'],'low'),

-- HOMABAY COUNTY
('Homa Bay County Teaching & Referral Hospital','hospital','Hospital Road, Homa Bay','Kenya','Homa Bay','Homa Bay Town',-0.5264,34.4570,'+254593020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Rachuonyo Sub-County Hospital','hospital','Kendu Bay, Kendu Bay','Kenya','Homa Bay','Rachuonyo North',-0.3667,34.6333,'+254720000006',ARRAY['cervical_screening','via_screening'],'low'),

-- MIGORI COUNTY
('Migori County Referral Hospital','hospital','Hospital Road, Migori','Kenya','Migori','Migori Town',-1.0644,34.4731,'+254597020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Isibania Sub-County Hospital','hospital','Isibania Town, Isibania','Kenya','Migori','Kuria West',-1.3167,34.2667,'+254720000007',ARRAY['cervical_screening'],'low'),

-- SIAYA COUNTY
('Siaya County Referral Hospital','hospital','Hospital Road, Siaya','Kenya','Siaya','Siaya Town',-0.0617,34.2883,'+254572060000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Yala Sub-District Hospital','hospital','Yala Town, Yala','Kenya','Siaya','Gem',0.1000,34.5333,'+254720000008',ARRAY['cervical_screening'],'low'),

-- VIHIGA COUNTY
('Vihiga County Referral Hospital','hospital','Hospital Road, Vihiga','Kenya','Vihiga','Vihiga Town',0.0833,34.7167,'+254556020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),

-- BUSIA COUNTY
('Busia County Referral Hospital','hospital','Hospital Road, Busia','Kenya','Busia','Busia Town',0.4606,34.1117,'+254553060000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Malaba Sub-County Hospital','hospital','Malaba Town, Malaba','Kenya','Busia','Teso North',0.6333,34.2833,'+254720000009',ARRAY['cervical_screening'],'low'),

-- TRANS NZOIA COUNTY
('Kitale County Referral Hospital','hospital','Hospital Road, Kitale','Kenya','Trans Nzoia','Kitale Town',1.0183,34.9958,'+254543020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Endebess Sub-County Hospital','hospital','Endebess Town, Endebess','Kenya','Trans Nzoia','Endebess',1.2833,34.8833,'+254720000010',ARRAY['cervical_screening'],'low'),

-- WEST POKOT COUNTY
('Kapenguria County Referral Hospital','hospital','Hospital Road, Kapenguria','Kenya','West Pokot','Kapenguria Town',1.2350,35.1103,'+254547020000',ARRAY['cervical_screening','basic_cancer_screening'],'low'),

-- ELGEYO MARAKWET COUNTY
('Iten County Referral Hospital','hospital','Hospital Road, Iten','Kenya','Elgeyo Marakwet','Keiyo North',0.6717,35.5083,'+254730000001',ARRAY['cervical_screening','basic_cancer_screening'],'low'),

-- BARINGO COUNTY
('Kabarnet County Referral Hospital','hospital','Hospital Road, Kabarnet','Kenya','Baringo','Baringo Central',0.4919,35.7417,'+254713000001',ARRAY['cervical_screening','basic_cancer_screening'],'low'),
('Eldama Ravine Sub-County Hospital','hospital','Eldama Ravine, Baringo','Kenya','Baringo','Koibatek',0.0564,35.7219,'+254720000011',ARRAY['cervical_screening'],'low'),

-- LAIKIPIA COUNTY
('Nanyuki County Referral Hospital','hospital','Hospital Road, Nanyuki','Kenya','Laikipia','Nanyuki Town',0.0179,37.0720,'+254622020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Nyahururu County Referral Hospital','hospital','Hospital Road, Nyahururu','Kenya','Laikipia','Kinangop',-0.0333,36.3667,'+254620022000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),

-- SAMBURU COUNTY
('Maralal County Referral Hospital','hospital','Hospital Road, Maralal','Kenya','Samburu','Samburu North',1.0983,36.6983,'+254720000012',ARRAY['cervical_screening','basic_cancer_screening'],'low'),

-- NYERI COUNTY
('Nyeri County Referral Hospital','hospital','Hospital Road, Nyeri','Kenya','Nyeri','Nyeri Town',-0.4167,36.9500,'+254614020000',ARRAY['cervical_screening','mammography','basic_oncology','pathology'],'high'),
('Karatina Sub-District Hospital','hospital','Karatina Town, Karatina','Kenya','Nyeri','Mathira',0.4833,37.1333,'+254614030000',ARRAY['cervical_screening','via_screening'],'medium'),

-- KIRINYAGA COUNTY
('Kerugoya County Referral Hospital','hospital','Hospital Road, Kerugoya','Kenya','Kirinyaga','Kirinyaga Central',-0.4989,37.2819,'+254616020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),

-- MURANG-A COUNTY
('Murang-a Level 5 Hospital','hospital','Hospital Road, Murang-a','Kenya','Murang-a','Murang-a Town',-0.7167,37.1500,'+254609020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Kangema Sub-County Hospital','hospital','Kangema Town, Kangema','Kenya','Murang-a','Kangema',-0.8167,36.9833,'+254720000013',ARRAY['cervical_screening'],'low'),

-- NYANDARUA COUNTY
('Ol Kalou County Referral Hospital','hospital','Hospital Road, Ol Kalou','Kenya','Nyandarua','Ol Kalou Town',-0.2667,36.3667,'+254617020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),

-- EMBU COUNTY
('Embu Level 5 Hospital','hospital','Hospital Road, Embu','Kenya','Embu','Embu Town',-0.5333,37.4500,'+254612020000',ARRAY['cervical_screening','mammography','basic_oncology','pathology'],'high'),

-- THARAKA NITHI COUNTY
('Chuka County Referral Hospital','hospital','Hospital Road, Chuka','Kenya','Tharaka Nithi','Chuka Town',-0.3383,37.6483,'+254720000014',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),

-- ISIOLO COUNTY
('Isiolo County Referral Hospital','hospital','Hospital Road, Isiolo','Kenya','Isiolo','Isiolo Town',0.3542,37.5819,'+254723020000',ARRAY['cervical_screening','basic_cancer_screening'],'low'),

-- MARSABIT COUNTY
('Marsabit County Referral Hospital','hospital','Hospital Road, Marsabit','Kenya','Marsabit','Marsabit Town',2.3333,37.9833,'+254720000015',ARRAY['cervical_screening','basic_cancer_screening'],'low'),

-- WAJIR COUNTY
('Wajir County Referral Hospital','hospital','Hospital Road, Wajir','Kenya','Wajir','Wajir Town',1.7500,40.0667,'+254720000016',ARRAY['cervical_screening','basic_cancer_screening'],'low'),

-- MANDERA COUNTY
('Mandera County Referral Hospital','hospital','Hospital Road, Mandera','Kenya','Mandera','Mandera Town',3.9333,41.8500,'+254720000017',ARRAY['cervical_screening'],'low'),

-- GARISSA COUNTY
('Garissa County Referral Hospital','hospital','Hospital Road, Garissa','Kenya','Garissa','Garissa Town',-0.4531,39.6461,'+254467020000',ARRAY['cervical_screening','basic_cancer_screening'],'low'),

-- TANA RIVER COUNTY
('Hola County Referral Hospital','hospital','Hospital Road, Hola','Kenya','Tana River','Tana River Town',-1.5000,40.0333,'+254720000018',ARRAY['cervical_screening'],'low'),

-- LAMU COUNTY
('King Fahad County Hospital Lamu','hospital','Hospital Road, Lamu','Kenya','Lamu','Lamu Town',-2.2683,40.9022,'+254424633141',ARRAY['cervical_screening','basic_cancer_screening'],'low'),

-- TAITA TAVETA COUNTY
('Moi County Referral Hospital Voi','hospital','Hospital Road, Voi','Kenya','Taita Taveta','Voi Town',-3.3958,38.5594,'+254437020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),

-- KAJIADO COUNTY
('Kajiado County Referral Hospital','hospital','Hospital Road, Kajiado','Kenya','Kajiado','Kajiado Town',-1.8500,36.7833,'+254720000019',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Ngong Sub-County Hospital','hospital','Ngong Town, Ngong','Kenya','Kajiado','Ngong',-1.3617,36.6590,'+254720000020',ARRAY['cervical_screening','via_screening'],'low'),

-- MAKUENI COUNTY
('Makueni County Referral Hospital','hospital','Hospital Road, Makueni','Kenya','Makueni','Makueni Town',-1.8056,37.6289,'+254720000021',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Wote Sub-County Hospital','hospital','Wote Town, Wote','Kenya','Makueni','Kibwezi',-1.7833,37.6333,'+254720000022',ARRAY['cervical_screening'],'low'),

-- KITUI COUNTY
('Kitui County Referral Hospital','hospital','Hospital Road, Kitui','Kenya','Kitui','Kitui Town',-1.3667,38.0167,'+254446020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Mutomo Sub-County Hospital','hospital','Mutomo Town, Mutomo','Kenya','Kitui','Kitui South',-1.8367,38.2117,'+254720000023',ARRAY['cervical_screening'],'low'),

-- BOMET COUNTY
('Bomet County Referral Hospital','hospital','Hospital Road, Bomet','Kenya','Bomet','Bomet Town',-0.7833,35.3417,'+254720000024',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),

-- KERICHO COUNTY
('Kericho County Referral Hospital','hospital','Hospital Road, Kericho','Kenya','Kericho','Kericho Town',-0.3692,35.2861,'+254526020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),

-- NANDI COUNTY
('Kapsabet County Referral Hospital','hospital','Hospital Road, Kapsabet','Kenya','Nandi','Kapsabet Town',0.2000,35.1000,'+254532020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),

-- NAROK COUNTY
('Narok County Referral Hospital','hospital','Hospital Road, Narok','Kenya','Narok','Narok Town',-1.0833,35.8667,'+254720000025',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),

-- TURKANA COUNTY
('Lodwar County Referral Hospital','hospital','Hospital Road, Lodwar','Kenya','Turkana','Lodwar Town',3.1194,35.5969,'+254543070000',ARRAY['cervical_screening','basic_cancer_screening'],'low')

ON CONFLICT DO NOTHING;

-- Health worker record
INSERT INTO health_workers (user_id, worker_id, specialization, assigned_regions, max_patients)
VALUES ('a0000000-0000-0000-0000-000000000003','CHW-KE-001','Community Health & Cancer Screening',ARRAY['Nairobi','Kiambu'],100)
ON CONFLICT (worker_id) DO NOTHING;
