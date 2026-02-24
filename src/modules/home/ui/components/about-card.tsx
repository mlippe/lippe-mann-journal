import CardContainer from '@/components/card-container';

const AboutCard = () => {
  return (
    <CardContainer>
      <div className='flex flex-col p-12 gap-20'>
        <h1 className='text-3xl'>Hallo! Moin! Servus! Grüzi!</h1>
        <div className='flex flex-col gap-4 font-light'>
          <p>
            In diesem Journal gibt es Einblicke in meine aktuellen Projekte,
            Gedankenfetzen zu Themen, die mich beschäftigen und Bilder aus
            meinem täglichen Leben.
          </p>
        </div>
      </div>
    </CardContainer>
  );
};

export default AboutCard;
