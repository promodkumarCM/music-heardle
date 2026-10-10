-- Film/album release years, not YouTube upload dates. Unknown years remain NULL.
-- Sources: https://en.wikipedia.org/wiki/Premam
-- https://en.wikipedia.org/wiki/Velipadinte_Pusthakam
-- https://en.wikipedia.org/wiki/Oru_Adaar_Love
-- https://en.wikipedia.org/wiki/Kumbalangi_Nights
-- https://en.wikipedia.org/wiki/Yuvvh
-- https://www.malayalachalachithram.com/movie.php?i=1963
-- https://en.wikipedia.org/wiki/Yodha_(1992_film)
-- https://en.wikipedia.org/wiki/Thenmavin_Kombath
-- https://en.wikipedia.org/wiki/Charlie_(2015_Malayalam_film)
-- https://en.wikipedia.org/wiki/Aavesham_(2024_film)
UPDATE songs SET release_year = CASE movie
  WHEN 'Velipadinte Pusthakam' THEN 2017
  WHEN 'Premam' THEN 2015
  WHEN 'Oru Adaar Love' THEN 2019
  WHEN 'Kumbalangi Nights' THEN 2019
  WHEN 'Yuvvh' THEN 2012
  WHEN 'Thoovanathumbikal' THEN 1987
  WHEN 'Yodha' THEN 1992
  WHEN 'Thenmaavin Kombathu' THEN 1994
  WHEN 'Charlie' THEN 2015
  WHEN 'Aavesham' THEN 2024
  ELSE NULL END
WHERE release_year IS NULL;

-- https://en.wikipedia.org/wiki/Jacobinte_Swargarajyam
UPDATE songs SET release_year = 2016 WHERE movie = 'Jacobinte Swargarajyam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Sapthamashree_Thaskaraha
UPDATE songs SET release_year = 2014 WHERE movie = 'Sapthamashree Thaskaraha' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Adam_Joan
UPDATE songs SET release_year = 2017 WHERE movie = 'Adam Joan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Oru_Muthassi_Gadha
UPDATE songs SET release_year = 2016 WHERE movie = 'Oru Muthassi Gadha' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Style_(2016_film)
UPDATE songs SET release_year = 2016 WHERE movie = 'Style' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Anugraheethan_Antony
UPDATE songs SET release_year = 2021 WHERE movie = 'Anugraheethan Antony' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Gauthamante_Radham
UPDATE songs SET release_year = 2020 WHERE movie = 'Gauthamante Radham' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Odum_Kuthira_Chaadum_Kuthira
UPDATE songs SET release_year = 2025 WHERE movie = 'Odum Kuthira Chaadum Kuthira' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Vikramadithyan
UPDATE songs SET release_year = 2014 WHERE movie = 'Vikramadithyan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Am_Ah
UPDATE songs SET release_year = 2025 WHERE movie = 'Am Ah' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Poomaram
UPDATE songs SET release_year = 2018 WHERE movie = 'Poomaram' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Phantom_(2002_film)
UPDATE songs SET release_year = 2002 WHERE movie = 'Phantom' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Chandrolsavam
UPDATE songs SET release_year = 2005 WHERE movie = 'Chandrolsavam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Moham
UPDATE songs SET release_year = 1974 WHERE movie = 'Moham' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Maheshinte_Prathikaaram
UPDATE songs SET release_year = 2016 WHERE movie = 'Maheshinte Prathikaaram' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Anuraga_Karikkin_Vellam
UPDATE songs SET release_year = 2016 WHERE movie = 'Anuraga Karikkin Vellam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Anandabhadram
UPDATE songs SET release_year = 2005 WHERE movie = 'Ananthabhadram' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Soothradharan
UPDATE songs SET release_year = 2001 WHERE movie = 'Soothradharan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Varayan
UPDATE songs SET release_year = 2022 WHERE movie = 'Varayan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/9_(2019_film)
UPDATE songs SET release_year = 2019 WHERE movie = '9' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Bethlehem_Kudumba_Unit
UPDATE songs SET release_year = 2026 WHERE movie = 'Bethlehem Kudumba Unit' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Narivetta
UPDATE songs SET release_year = 2025 WHERE movie = 'Narivetta' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/King_of_Kotha
UPDATE songs SET release_year = 2023 WHERE movie = 'King of Kotha' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Pattalam_(2003_film)
UPDATE songs SET release_year = 2003 WHERE movie = 'Pattalam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Thudarum
UPDATE songs SET release_year = 2025 WHERE movie = 'Thudarum' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Hridayapoorvam
UPDATE songs SET release_year = 2025 WHERE movie = 'Hridayapoorvam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Dreamz_(2000_film)
UPDATE songs SET release_year = 2000 WHERE movie = 'Dreams' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Nadodikkattu
UPDATE songs SET release_year = 1987 WHERE movie = 'Nadodikkattu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Thalavattam
UPDATE songs SET release_year = 1986 WHERE movie = 'Thalavattam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Chakkaramuthu
UPDATE songs SET release_year = 2006 WHERE movie = 'Chakkaramuthu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Dasharatham
UPDATE songs SET release_year = 1989 WHERE movie = 'Dasharatham' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Bhaskar_the_Rascal
UPDATE songs SET release_year = 2015 WHERE movie = 'Bhaskar the Rascal' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Vellimoonga
UPDATE songs SET release_year = 2014 WHERE movie = 'Vellimoonga' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Athiran
UPDATE songs SET release_year = 2019 WHERE movie = 'Athiran' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Beautiful_(2011_film)
UPDATE songs SET release_year = 2011 WHERE movie = 'Beautiful' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Sarvam_Maya
UPDATE songs SET release_year = 2025 WHERE movie = 'Sarvam Maya' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Kurup_(film)
UPDATE songs SET release_year = 2021 WHERE movie = 'Kurup' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Romancham
UPDATE songs SET release_year = 2023 WHERE movie = 'Romancham' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Super_Sharanya
UPDATE songs SET release_year = 2022 WHERE movie = 'Super Sharanya' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Kumari_(2022_film)
UPDATE songs SET release_year = 2022 WHERE movie = 'Kumari' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Bheeshma_Parvam
UPDATE songs SET release_year = 2022 WHERE movie = 'Bheeshma Parvam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Pallichattambi
UPDATE songs SET release_year = 2026 WHERE movie = 'Pallichattambi' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Philips_and_the_Monkey_Pen
UPDATE songs SET release_year = 2013 WHERE movie = 'Philips and the Monkey Pen' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Manikyakkallu
UPDATE songs SET release_year = 2011 WHERE movie = 'Manikyakkallu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Vettam
UPDATE songs SET release_year = 2004 WHERE movie = 'Vettam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Maanthrikam
UPDATE songs SET release_year = 1995 WHERE movie = 'Manthrikam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Mazhayethum_Munpe
UPDATE songs SET release_year = 1995 WHERE movie = 'Mazhayethum Munpe' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ravanaprabhu
UPDATE songs SET release_year = 2001 WHERE movie = 'Ravanaprabhu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Oru_Abhibhashakante_Case_Diary
UPDATE songs SET release_year = 1995 WHERE movie = 'Oru Abhibhashakante Case Diary' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Idanazhiyil_Oru_Kaalocha
UPDATE songs SET release_year = 1987 WHERE movie = 'Idanaazhiyil Oru Kaalocha' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Kadha_Thudarunnu
UPDATE songs SET release_year = 2010 WHERE movie = 'Kadha Thudarunnu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Thanmathra
UPDATE songs SET release_year = 2005 WHERE movie = 'Thanmatra' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Drona_2010
UPDATE songs SET release_year = 2010 WHERE movie = 'Drona' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Cocktail_(2010_film)
UPDATE songs SET release_year = 2010 WHERE movie = 'Cocktail' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Body_Guard_(2010_film)
UPDATE songs SET release_year = 2010 WHERE movie = 'Bodyguard' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Anwar_(2010_film)
UPDATE songs SET release_year = 2010 WHERE movie = 'Anwar' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/4_the_People
UPDATE songs SET release_year = 2004 WHERE movie = '4 The People' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/2018_(film)
UPDATE songs SET release_year = 2023 WHERE movie = '2018' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Shikkari_Shambhu
UPDATE songs SET release_year = 2018 WHERE movie = 'Shikkari Shambhu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Abrahaminte_Santhathikal
UPDATE songs SET release_year = 2018 WHERE movie = 'Abrahaminte Santhathikal' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Take_Off_(2017_film)
UPDATE songs SET release_year = 2017 WHERE movie = 'Take Off' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Two_Countries
UPDATE songs SET release_year = 2015 WHERE movie = 'Two Countries' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Theevandi
UPDATE songs SET release_year = 2018 WHERE movie = 'Theevandi' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ivan_Maryadaraman
UPDATE songs SET release_year = 2015 WHERE movie = 'Ivan Maryadaraman' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Chandrettan_Evideya
UPDATE songs SET release_year = 2015 WHERE movie = 'Chandrettan Evideya' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Neram
UPDATE songs SET release_year = 2013 WHERE movie = 'Neram' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Thalavara
UPDATE songs SET release_year = 2025 WHERE movie = 'Thalavara' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/RDX_(film)
UPDATE songs SET release_year = 2023 WHERE movie = 'RDX' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Pathaam_Valavu
UPDATE songs SET release_year = 2022 WHERE movie = 'Pathaam Valavu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/ARM_(film)
UPDATE songs SET release_year = 2024 WHERE movie = 'ARM' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ishq_(2019_film)
UPDATE songs SET release_year = 2019 WHERE movie = 'Ishq' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Lion_(2006_film)
UPDATE songs SET release_year = 2006 WHERE movie = 'Lion' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Maniyarayile_Ashokan
UPDATE songs SET release_year = 2020 WHERE movie = 'Maniyarayile Ashokan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Luca_(2019_film)
UPDATE songs SET release_year = 2019 WHERE movie = 'Luca' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ulladakkam
UPDATE songs SET release_year = 1991 WHERE movie = 'Ulladakkam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Kanmadam
UPDATE songs SET release_year = 1998 WHERE movie = 'Kanmadam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Pakshe
UPDATE songs SET release_year = 1994 WHERE movie = 'Pakshe' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Nakhakshathangal
UPDATE songs SET release_year = 1986 WHERE movie = 'Nakhakshathangal' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Mahasamudram
UPDATE songs SET release_year = 2006 WHERE movie = 'Mahasamudram' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Kanaka_Simhasanam
UPDATE songs SET release_year = 2006 WHERE movie = 'Kanaka Simhasanam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Aparichithan
UPDATE songs SET release_year = 2004 WHERE movie = 'Aparichithan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Snehithan
UPDATE songs SET release_year = 2002 WHERE movie = 'Snehithan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Velli_Thirai
UPDATE songs SET release_year = 2008 WHERE movie = 'Vellithira' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Udaharanam_Sujatha
UPDATE songs SET release_year = 2017 WHERE movie = 'Udaharanam Sujatha' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Nammal_Thammil
UPDATE songs SET release_year = 2009 WHERE movie = 'Nammal Thammil' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Pranayavarnangal
UPDATE songs SET release_year = 1998 WHERE movie = 'Pranayavarnangal' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Snegithiye
UPDATE songs SET release_year = 2000 WHERE movie = 'Raakilipattu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Summer_in_Bethlehem
UPDATE songs SET release_year = 1998 WHERE movie = 'Summer in Bethlehem' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Chanthupottu
UPDATE songs SET release_year = 2005 WHERE movie = 'Chanthupottu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Oppam
UPDATE songs SET release_year = 2016 WHERE movie = 'Oppam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Praja
UPDATE songs SET release_year = 2001 WHERE movie = 'Praja' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Mr._Brahmachari
UPDATE songs SET release_year = 2003 WHERE movie = 'Mr. Brahmachari' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Natturajavu
UPDATE songs SET release_year = 2004 WHERE movie = 'Natturajavu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Rajavinte_Makan
UPDATE songs SET release_year = 1986 WHERE movie = 'Rajavinte Makan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Varnapakittu
UPDATE songs SET release_year = 1997 WHERE movie = 'Varnapakittu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Venkalam
UPDATE songs SET release_year = 1993 WHERE movie = 'Venkalam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Amaram
UPDATE songs SET release_year = 1991 WHERE movie = 'Amaram' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Champakulam_Thachan
UPDATE songs SET release_year = 1992 WHERE movie = 'Champakulam Thachan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/His_Highness_Abdullah
UPDATE songs SET release_year = 1990 WHERE movie = 'His Highness Abdullah' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Belt_Mathai
UPDATE songs SET release_year = 1983 WHERE movie = 'Belt Mathai' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Choola
UPDATE songs SET release_year = 1979 WHERE movie = 'Choola' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Aaraam_Thampuran
UPDATE songs SET release_year = 1997 WHERE movie = 'Aaraam Thampuran' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Soorya_Gayathri
UPDATE songs SET release_year = 1992 WHERE movie = 'Soorya Gayathri' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Vadakkunokkiyantram
UPDATE songs SET release_year = 1989 WHERE movie = 'Vadakkunokkiyanthram' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ee_Puzhayum_Kadannu
UPDATE songs SET release_year = 1996 WHERE movie = 'Ee Puzhayum Kadannu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Samooham
UPDATE songs SET release_year = 1993 WHERE movie = 'Samooham' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Pavam_Pavam_Rajakumaran
UPDATE songs SET release_year = 1990 WHERE movie = 'Pavam Pavam Rajakumaran' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Malootty
UPDATE songs SET release_year = 1990 WHERE movie = 'Malootty' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Sringaravelan
UPDATE songs SET release_year = 2013 WHERE movie = 'Sringaravelan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Kochi_Rajavu
UPDATE songs SET release_year = 2005 WHERE movie = 'Kochi Rajavu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Megham
UPDATE songs SET release_year = 1999 WHERE movie = 'Megham' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Georgettan's_Pooram
UPDATE songs SET release_year = 2017 WHERE movie = 'Georgettans Pooram' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Abraham_Ozler
UPDATE songs SET release_year = 2024 WHERE movie = 'Abraham Ozler' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ezhupunna_Tharakan
UPDATE songs SET release_year = 1999 WHERE movie = 'Ezhupunna Tharakan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Mizhi_Randilum
UPDATE songs SET release_year = 2003 WHERE movie = 'Mizhi Randilum' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Samshayam
UPDATE songs SET release_year = 2025 WHERE movie = 'Samshayam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Speed_Track
UPDATE songs SET release_year = 2007 WHERE movie = 'Speed Track' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ramaleela
UPDATE songs SET release_year = 2017 WHERE movie = 'Ramaleela' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Kammara_Sambhavam
UPDATE songs SET release_year = 2018 WHERE movie = 'Kammara Sambhavam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Valliettan
UPDATE songs SET release_year = 2000 WHERE movie = 'Valyettan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Kaduva
UPDATE songs SET release_year = 2022 WHERE movie = 'Kaduva' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Bro_Daddy
UPDATE songs SET release_year = 2022 WHERE movie = 'Bro Daddy' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Daivathinte_Makan
UPDATE songs SET release_year = 2000 WHERE movie = 'Daivathinte Makan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Kochu_Kochu_Santhoshangal
UPDATE songs SET release_year = 2000 WHERE movie = 'Kochu Kochu Santhoshangal' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Veruthe_Oru_Bharya
UPDATE songs SET release_year = 2008 WHERE movie = 'Veruthe Oru Bharya' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Kohinoor_(2015_film)
UPDATE songs SET release_year = 2015 WHERE movie = 'Kohinoor' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Paavada
UPDATE songs SET release_year = 2016 WHERE movie = 'Paavada' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ezra_(2017_film)
UPDATE songs SET release_year = 2017 WHERE movie = 'Ezra' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Sathyam_(2004_film)
UPDATE songs SET release_year = 2004 WHERE movie = 'Sathyam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Manassinakkare
UPDATE songs SET release_year = 2003 WHERE movie = 'Manasinakkare' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Diamond_Necklace_(film)
UPDATE songs SET release_year = 2012 WHERE movie = 'Diamond Necklace' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Anarkali_(2015_film)
UPDATE songs SET release_year = 2015 WHERE movie = 'Anarkali' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Pranayam_(2011_film)
UPDATE songs SET release_year = 2011 WHERE movie = 'Pranayam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/London_Bridge_(film)
UPDATE songs SET release_year = 2014 WHERE movie = 'London Bridge' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Role_Models_(2017_film)
UPDATE songs SET release_year = 2017 WHERE movie = 'Role Models' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ustaad_(1999_film)
UPDATE songs SET release_year = 1999 WHERE movie = 'Ustaad' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Chandamama_(1999_film)
UPDATE songs SET release_year = 1999 WHERE movie = 'Chandamama' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Naduvazhikal
UPDATE songs SET release_year = 1989 WHERE movie = 'Naaduvaazhikal' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Adi_Kapyare_Kootamani
UPDATE songs SET release_year = 2015 WHERE movie = 'Adi Kapyare Koottamani' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ira_(film)
UPDATE songs SET release_year = 2018 WHERE movie = 'Ira' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ben_Johnson_(film)
UPDATE songs SET release_year = 2005 WHERE movie = 'Ben Johnson' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Rani%3A_The_Real_Story
UPDATE songs SET release_year = 2023 WHERE movie = 'Rani' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Life_Is_Beautiful_(2000_film)
UPDATE songs SET release_year = 2000 WHERE movie = 'Life Is Beautiful' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Boyy_Friennd
UPDATE songs SET release_year = 2005 WHERE movie = 'Boy Friend' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Charminar_(2018_film)
UPDATE songs SET release_year = 2018 WHERE movie = 'Charminar' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/KL_10_Patthu
UPDATE songs SET release_year = 2015 WHERE movie = 'KL10 Pathu' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Ranam_(2018_film)
UPDATE songs SET release_year = 2018 WHERE movie = 'Ranam' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Adios_Amigo_(2024_film)
UPDATE songs SET release_year = 2024 WHERE movie = 'Adios Amigo' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Painkili
UPDATE songs SET release_year = 2025 WHERE movie = 'Painkili' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Chemistry_(2009_film)
UPDATE songs SET release_year = 2009 WHERE movie = 'Chemistry' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Calendar_(2009_film)
UPDATE songs SET release_year = 2009 WHERE movie = 'Calendar' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Vellinakshatram_(2004_film)
UPDATE songs SET release_year = 2004 WHERE movie = 'Vellinakshatram' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Dubai_(2001_film)
UPDATE songs SET release_year = 2001 WHERE movie = 'Dubai' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Big_Brother_(2020_film)
UPDATE songs SET release_year = 2020 WHERE movie = 'Big Brother' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Hallo_(film)
UPDATE songs SET release_year = 2007 WHERE movie = 'Hallo' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/July_4_(film)
UPDATE songs SET release_year = 2007 WHERE movie = 'July 4' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Meesa_Madhavan
UPDATE songs SET release_year = 2002 WHERE movie = 'Meesamadhavan' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Shylock_(2020_film)
UPDATE songs SET release_year = 2020 WHERE movie = 'Shylock' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/One_(2021_film)
UPDATE songs SET release_year = 2021 WHERE movie = 'One' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Pokkiri_Raja_(2010_film)
UPDATE songs SET release_year = 2010 WHERE movie = 'Pokkiri Raja' AND release_year IS NULL;

-- https://en.wikipedia.org/wiki/Mayabazar_(2008_film)
UPDATE songs SET release_year = 2008 WHERE movie = 'Maayabazar' AND release_year IS NULL;
