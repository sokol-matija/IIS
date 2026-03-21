# Vježba 03 - XQuery rješenja

Alat: https://www.videlibri.de/cgi-bin/xidelcgi
XML datoteka: `imenik.xml`

---

## 1. Dohvat svih osoba

```xquery
for $o in ./imenik//osoba
return $o
```

---

## 2. Dohvat svih osoba čije ime je Ana

```xquery
for $o in ./imenik//osoba
where $o/ime = "Ana"
return $o
```

---

## 3. Dohvat svih imena osoba čiji je poštanski broj 10000, sortirano abecedno

```xquery
for $o in ./imenik//osoba
where $o/adresa/postanski_broj = "10000"
order by $o/ime ascending
return $o/ime
```

---

## 4. Stvaranje HTML liste koja ispisuje sva prezimena (jedno po retku)

```xquery
<ul>{
  for $o in ./imenik//osoba
  return <li>{string($o/prezime)}</li>
}</ul>
```

---

## 5. Dohvat imena i prezimena svih osoba koje nemaju atribut OIB

```xquery
for $o in ./imenik//osoba
where not($o/@OIB)
return concat($o/ime, " ", $o/prezime)
```

---

## 6. Dohvat imena i prezimena svih osoba kojima je duljina zapisa atributa OIB različita od 11 znakova

```xquery
for $o in ./imenik//osoba
where string-length($o/@OIB) != 11
return concat($o/ime, " ", $o/prezime)
```

---

## 7. Dohvat telefona svih osoba čiji sadržaj elementa kategorija nije Privatni

```xquery
for $o in ./imenik//osoba
where $o/kategorija != "Privatni"
return $o/telefon
```

---

## 8. Dohvat e-mail adresa svih osoba čija prezimena završavaju na „ić"

```xquery
for $o in ./imenik//osoba
where ends-with($o/prezime, "ić")
return $o/email
```
