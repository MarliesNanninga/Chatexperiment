# 💼 Sollicitatiegesprek Trainer

> **Een interactieve AI-powered tool om je sollicitatievaardigheden te oefenen en verbeteren**

Een geavanceerde Next.js applicatie die gebruikers helpt zich voor te bereiden op sollicitatiegesprekken door realistische gesprekssimulaties met AI-feedback.

## 🚀 Live Demo

**Deployed on Netlify:** https://heartfelt-longma-c1226d.netlify.app

## ⚠️ Setup Vereist

**BELANGRIJK:** Voor de applicatie werkt, moet je een Gemini API key toevoegen:

### Voor Netlify Deployment:
1. Ga naar je [Netlify Dashboard](https://app.netlify.com)
2. Selecteer je site: `heartfelt-longma-c1226d`
3. Ga naar **Site settings** → **Environment variables**
4. Klik **Add variable**
5. Voeg toe:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Je Gemini API key (krijg je gratis op [Google AI Studio](https://makersuite.google.com/app/apikey))
6. Klik **Save** en **Deploy** opnieuw

### Gemini API Key Verkrijgen:
1. Ga naar [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Log in met je Google account
3. Klik **Create API Key**
4. Kopieer de gegenereerde key
5. Voeg deze toe aan je Netlify environment variables

## ✨ Hoofdfuncties

### 🎯 **Gepersonaliseerde Gesprekken**
- Aangepast aan jouw specifieke functie en ervaring
- Verschillende gesprekstypes: Algemeen, Gedrag, Technisch, Situationeel
- Realistische vragen passend bij je sector

### 💡 **Slimme AI Interviewer**
- Natuurlijke gespreksstroom met Gemini AI
- Dynamische vervolgvragen gebaseerd op je antwoorden
- Professionele, menselijke interactie

### 📊 **Uitgebreide Feedback**
- Gedetailleerde analyse van je prestatie
- Concrete verbeterpunten en tips
- Score met uitleg voor je algehele performance

### 🎨 **Gebruiksvriendelijke Interface**
- Intuïtieve setup voor gespreksinstellingen
- Real-time chat interface
- Responsive design voor alle apparaten
- Studiemeister-geïnspireerde styling

## 🚀 Gesprekstypes

| Type | Beschrijving | Voorbeelden |
|------|-------------|-------------|
| **Algemene Vragen** | Standaard sollicitatievragen | "Vertel over jezelf", "Waarom deze functie?" |
| **Gedragsvragen** | STAR-methode situaties | "Beschrijf een uitdaging die je hebt overwonnen" |
| **Technische Vragen** | Vakspecifieke competenties | Afhankelijk van je functie en sector |
| **Situationele Vragen** | Hypothetische scenario's | "Hoe zou je reageren als..." |

## 🛠️ Technische Specificaties

### **Framework & Libraries**
- **Next.js 15** - React framework met server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling (Studiemeister theme)
- **Gemini AI** - Geavanceerde conversatie AI

### **Core Features**
- **Streaming Responses** - Real-time AI antwoorden
- **Session Management** - Gespreksstatus bijhouden
- **Responsive Design** - Optimaal op alle schermformaten
- **Markdown Rendering** - Rijke tekstopmaak
- **Export Functionaliteit** - Feedback opslaan als Word document
- **Voice Input** - Spraakherkenning voor natuurlijke interactie
- **Text-to-Speech** - Interviewer vragen worden voorgelezen

## 📋 Gebruiksflow

### 1. **Setup Fase**
```
Persoonlijke gegevens → Functietitel invoeren → Bedrijf (optioneel) → 
Ervaring selecteren → Sector specificeren → Gesprektype kiezen → 
Audio instellingen → Start gesprek
```

### 2. **Interview Fase**
```
AI stelt vraag → Jij antwoordt (typen of spreken) → AI geeft vervolgvraag → 
Herhaal 5-7 keer → Gesprek wordt afgesloten
```

### 3. **Feedback Fase**
```
AI analyseert gesprek → Gedetailleerde feedback → 
Verbeterpunten → Score → Opties voor nieuw gesprek
```

## 🎯 Doelgroepen

### 👨‍💼 **Professionals**
- Carrière switchers die zich voorbereiden op nieuwe sectoren
- Ervaren professionals die hun skills willen aanscherpen
- Managers die hun interview technieken willen verbeteren

### 👩‍🎓 **Studenten & Starters**
- Afgestudeerden die hun eerste baan zoeken
- Studenten die stage-interviews voorbereiden
- Young professionals die hun zelfvertrouwen willen opbouwen

### 🏢 **HR & Recruitment**
- HR professionals die kandidaten willen helpen voorbereiden
- Recruitment bureaus als service voor kandidaten
- Career coaches als ondersteuning tool

## 🔧 Lokale Installatie & Setup

### **Vereisten**
- Node.js 18+ 
- Gemini API Key (gratis verkrijgbaar)

### **Quick Start**
```bash
# Clone repository
git clone [repository-url]
cd sollicitatiegesprek-trainer

# Dependencies installeren
npm install

# Environment variables
cp .env.example .env.local
# Voeg je GEMINI_API_KEY toe

# Development server starten
npm run dev
# Open http://localhost:3000
```

### **Environment Variables**
```env
# Vereist voor alle AI functionaliteiten
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🌐 Deployment

### **Netlify (Aanbevolen)**
1. Connect GitHub repository
2. Build command: `npm run build`
3. **BELANGRIJK:** Environment variables instellen in Netlify dashboard
4. Deploy!

### **Vercel Alternative**
```bash
npm install -g vercel
vercel --prod
```

## 🔧 Troubleshooting

### **Veelgestelde Problemen**

#### ❌ "API configuratie ontbreekt" Error
**Oorzaak:** GEMINI_API_KEY environment variable niet ingesteld
**Oplossing:** 
1. Ga naar Netlify Dashboard → Site settings → Environment variables
2. Voeg `GEMINI_API_KEY` toe met je API key
3. Redeploy de site

#### ❌ "HTTP error! status: 500" 
**Oorzaak:** API key is ongeldig of quota overschreden
**Oplossing:**
1. Controleer of je API key correct is
2. Ga naar [Google AI Studio](https://makersuite.google.com/app/apikey) om quota te checken
3. Genereer eventueel een nieuwe API key

#### ❌ Streaming responses werken niet
**Oorzaak:** Netwerkverbinding of browser compatibility
**Oplossing:**
1. Gebruik een moderne browser (Chrome, Firefox, Safari)
2. Controleer internetverbinding
3. Disable ad-blockers tijdelijk

## 📊 Feedback Systeem

De AI analyseert gesprekken op basis van:

### **Inhoudelijke Aspecten**
- Relevantie van antwoorden
- Structuur en duidelijkheid
- Voorbeelden en concrete situaties
- Motivatie en enthousiasme

### **Communicatie Skills**
- Luistervaardigheden
- Vraagstelling
- Zelfvertrouwen
- Professionaliteit

### **Gesprekstechniek**
- STAR-methode toepassing
- Timing van antwoorden
- Interactie met interviewer
- Afsluiting van gesprek

## 🎓 Educatieve Waarde

### **Leeruitkomsten**
- Verbeterde zelfpresentatie
- Meer zelfvertrouwen in gesprekssituaties
- Beter begrip van verschillende vraagtypen
- Praktische ervaring in veilige omgeving

### **Skill Development**
- Communicatievaardigheden
- Storytelling met STAR-methode
- Zelfanalyse en reflectie
- Professionele gesprekstechnieken

## 🎨 Design & Styling

### **Studiemeister-geïnspireerde Interface**
- **Clean, moderne uitstraling** met witte achtergronden en subtiele schaduwen
- **Pink accent kleur** (#ec4899) voor buttons en highlights
- **Card-based layout** voor overzichtelijke informatie
- **Consistent typography** met duidelijke hiërarchie
- **Responsive design** dat perfect werkt op alle apparaten

### **User Experience**
- **Intuïtieve navigatie** tussen setup, interview en feedback fases
- **Real-time feedback** tijdens het gesprek
- **Voice & text input** opties voor natuurlijke interactie
- **Auto-play TTS** voor realistische gesprekservaring

## 🔒 Privacy & Veiligheid

- **Geen data opslag** - Gesprekken worden niet permanent bewaard
- **Lokale verwerking** - Sessies blijven in browser
- **API Security** - Veilige communicatie met Gemini AI
- **GDPR Compliant** - Privacy-first design

## 🤝 Contributing

Bijdragen zijn welkom! Zie onze [Contributing Guidelines](CONTRIBUTING.md) voor meer informatie.

### **Development Workflow**
```bash
# Feature branch maken
git checkout -b feature/nieuwe-functie

# Changes maken en testen
npm run dev
npm run build

# Pull request maken
git push origin feature/nieuwe-functie
```

## 📈 Roadmap

### **Versie 2.0**
- [ ] Video interview simulatie
- [ ] Meerdere AI interviewer persoonlijkheden
- [ ] Sector-specifieke vragenbanken
- [ ] Progress tracking over tijd

### **Versie 3.0**
- [ ] Team interview simulaties
- [ ] Real-time emotie analyse
- [ ] Advanced voice analysis
- [ ] Mobile app versie

## 🆘 Support & Troubleshooting

### **Contact**
- GitHub Issues voor bugs en feature requests
- Documentatie voor uitgebreide handleidingen

---

## 🎉 **Klaar om je Sollicitatievaardigheden te Verbeteren?**

**🔗 Live Demo:** https://heartfelt-longma-c1226d.netlify.app

Start nu en bouw het zelfvertrouwen op dat je nodig hebt voor je volgende carrièrestap!

**💼 Veel succes met je sollicitatiegesprekken!**

---

*Sollicitatiegesprek Trainer v1.0 - Powered by Gemini AI & Studiemeister Design*  
*Last updated: December 2024*