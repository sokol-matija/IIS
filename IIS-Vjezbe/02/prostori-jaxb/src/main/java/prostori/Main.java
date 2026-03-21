package prostori;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import javax.xml.bind.Unmarshaller;

import java.io.File;
import java.math.BigInteger;

public class Main {

    public static void main(String[] args) throws JAXBException {

        ObjectFactory of = new ObjectFactory();
        Prostori prostori = of.createProstori();

        // Prostor 1
        Prostori.Prostor p1 = of.createProstoriProstor();
        p1.setId(BigInteger.valueOf(1));
        p1.setPovrsina(BigInteger.valueOf(45));
        p1.setLokacija("Zagreb, Ilica 10");
        prostori.getProstor().add(p1);

        // Prostor 2
        Prostori.Prostor p2 = of.createProstoriProstor();
        p2.setId(BigInteger.valueOf(2));
        p2.setPovrsina(BigInteger.valueOf(120));
        p2.setLokacija("Split, Vukovarska 5");
        prostori.getProstor().add(p2);

        // Prostor 3
        Prostori.Prostor p3 = of.createProstoriProstor();
        p3.setId(BigInteger.valueOf(3));
        p3.setPovrsina(BigInteger.valueOf(30));
        p3.setLokacija("Rijeka, Korzo 7");
        prostori.getProstor().add(p3);

        // Marshal
        JAXBContext jc = JAXBContext.newInstance(Prostori.class);
        Marshaller m = jc.createMarshaller();
        m.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);

        m.marshal(prostori, System.out);

        File file = new File("prostori.xml");
        m.marshal(prostori, file);
        System.out.println("\nProstori spremljeni u: " + file.getAbsolutePath());

        // Unmarshal
        System.out.println("\n--- UNMARSHAL ---");
        Unmarshaller u = jc.createUnmarshaller();
        Prostori ucitaniProstori = (Prostori) u.unmarshal(file);

        for (Prostori.Prostor p : ucitaniProstori.getProstor()) {
            System.out.println("ID: " + p.getId() + " | Površina: " + p.getPovrsina() + " m² | Lokacija: " + p.getLokacija());
        }
    }
}
