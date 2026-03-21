package imenik;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;

import java.io.File;
import java.math.BigInteger;

public class Main {

    public static void main(String[] args) throws JAXBException {

        ObjectFactory of = new ObjectFactory();
        Imenik imenik = of.createImenik();

        // Osoba 1
        Imenik.Osoba o1 = of.createImenikOsoba();
        o1.setOib("12345678901");
        o1.setIme("Ana");
        o1.setPrezime("Anić");
        o1.setEmail("ana.anic@example.com");
        o1.setTelefon("091-111-2222");
        o1.setKategorija("Privatni");

        Imenik.Osoba.Adresa a1 = of.createImenikOsobaAdresa();
        a1.setUlica("Ilica");
        a1.setKucniBroj("10");
        a1.setMjesto("Zagreb");
        a1.setPostanskiBroj(BigInteger.valueOf(10000));
        o1.setAdresa(a1);

        imenik.getOsoba().add(o1);

        // Osoba 2
        Imenik.Osoba o2 = of.createImenikOsoba();
        o2.setOib("98765432100");
        o2.setIme("Ivan");
        o2.setPrezime("Ivić");
        o2.setEmail("ivan.ivic@firma.hr");
        o2.setTelefon("099-333-4444");
        o2.setKategorija("Poslovni");

        Imenik.Osoba.Adresa a2 = of.createImenikOsobaAdresa();
        a2.setUlica("Savska");
        a2.setKucniBroj("5A");
        a2.setMjesto("Zagreb");
        a2.setPostanskiBroj(BigInteger.valueOf(10000));
        o2.setAdresa(a2);

        imenik.getOsoba().add(o2);

        // Osoba 3
        Imenik.Osoba o3 = of.createImenikOsoba();
        o3.setOib("11122233344");
        o3.setIme("Maja");
        o3.setPrezime("Majić");
        o3.setEmail("maja.majic@email.com");
        o3.setTelefon("095-555-6666");
        o3.setKategorija("Privatni");

        Imenik.Osoba.Adresa a3 = of.createImenikOsobaAdresa();
        a3.setUlica("Vukovarska");
        a3.setKucniBroj("42");
        a3.setMjesto("Split");
        a3.setPostanskiBroj(BigInteger.valueOf(21000));
        o3.setAdresa(a3);

        imenik.getOsoba().add(o3);

        // Marshal
        JAXBContext jc = JAXBContext.newInstance(Imenik.class);
        Marshaller m = jc.createMarshaller();
        m.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);

        m.marshal(imenik, System.out);

        File file = new File("imenik.xml");
        m.marshal(imenik, file);

        System.out.println("\nImenik spremljen u: " + file.getAbsolutePath());
    }
}
