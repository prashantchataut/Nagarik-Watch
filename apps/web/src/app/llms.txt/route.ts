/** llms.txt — a card for AI crawlers/assistants (grows AI-search discoverability). */
export function GET() {
  const body = `# नागरिक वाच (Nagarik Watch)

> नेपालको डेवनागरी-प्रथम डिजिटल समाचार पोर्टल। राजनीति, समाज, बजार, खेलकुद, विपद्, तथ्य जाँच र प्रदेश समाचार।

## मुख्य सतहहरू
- [गृहपृष्ठ](https://nagarikwatch.com/): आजको संस्करण
- [सबै समाचार](https://nagarikwatch.com/feed): पूर्ण फिड
- [विपद् केन्द्र](https://nagarikwatch.com/disaster): बाढी/प्रकोप तथ्याङ्क र सुरक्षा
- [तथ्य जाँच](https://nagarikwatch.com/fact-check): भाइरल दाबीको निर्णय
- [पात्रो](https://nagarikwatch.com/patro): वि.सं. पात्रो र चाडपर्व
- [बजार](https://nagarikwatch.com/nepse): NEPSE, विदेशी मुद्रा
- [आरएसएस](https://nagarikwatch.com/api/rss): फिड

## नीति
- सम्पादकीय मापदण्ड: https://nagarikwatch.com/ethics
- तथ्य जाँच कार्यविधि: स्रोत-प्रमाण आधारित, निर्णय सार्वजनिक
- भाषा: नेपाली (मुख्य), अङ्ग्रेजी (सहायक)
`
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
