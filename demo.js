/* Roupas e fotos ilustrativas: somente no modo sem Supabase configurado. */
const photo = id => 'https://images.unsplash.com/'+id+'?w=850&q=80&fit=crop';
export const DEMO_PRODUCTS=[
{id:'demo-1',name:'Conjunto Essence',description:'Visual leve e sofisticado para todos os seus momentos.',category:'feminino',price:189.90,photos:[photo('photo-1539109136881-3be0616acf4b')]},
{id:'demo-2',name:'Camisa Urban Classic',description:'Estilo contemporâneo e versatilidade numa peça especial.',category:'masculino',price:149.90,photos:[photo('photo-1598032895397-b9472444bf93')]},
{id:'demo-3',name:'Set Active Move',description:'Conforto e liberdade de movimento para seu ritmo.',category:'fitness',price:129.90,photos:[photo('photo-1518611012118-696072aa579a')]},
{id:'demo-4',name:'Blazer Signature',description:'Elegância minimalista para composições marcantes.',category:'feminino',price:269.90,photos:[photo('photo-1483985988355-763728e1935b')]}
];