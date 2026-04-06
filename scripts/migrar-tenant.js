const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCIwYY2pIaRHATxxp0r0f5myFV23oxrQfE",
  authDomain: "loyalty-camp.firebaseapp.com",
  databaseURL: "https://loyalty-camp-default-rtdb.firebaseio.com",
  projectId: "loyalty-camp",
  storageBucket: "loyalty-camp.firebasestorage.app",
  messagingSenderId: "509358830444",
  appId: "1:509358830444:web:0420b7b6def8b5085a7949"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TENANT_ID = 'sabor-latino';

const COLECCIONES = [
  'clientes',
  'transacciones', 
  'premios',
  'promociones',
  'sucursales',
  'cajeros',
  'ofertas_puntos',
  'usuarios_roles',
];

const migrar = async () => {
  for (const coleccion of COLECCIONES) {
    console.log(`Migrando ${coleccion}...`);
    const snap = await getDocs(collection(db, coleccion));
    let count = 0;
    for (const documento of snap.docs) {
      if (!documento.data().tenant_id) {
        await updateDoc(doc(db, coleccion, documento.id), {
          tenant_id: TENANT_ID,
        });
        count++;
      }
    }
    console.log(`✓ ${coleccion}: ${count} documentos actualizados`);
  }
  console.log('✅ Migración completada');
  process.exit(0);
};

migrar().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});