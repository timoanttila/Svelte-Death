<script>
    import { url, layout, metatags } from "@sveltech/routify"
   	const posts = $layout.parent.children
		.filter((c) => c.meta["frontmatter"])
        .sort((a, b) => a.meta["frontmatter"].published.localeCompare(b.meta["frontmatter"].published))
    let title = "Tutkielma kuolemasta"
    let summary = "Kuolema odottaa meitä kaikkia, mutta mitä meille oikeasti tapahtuu kuollessa ja voiko kuollutta herättää henkiin? Voiko uskonnot tarjota meille ikuista elämää?"
	$: metatags.title = title
	$: metatags.description = summary
	$: metatags["twitter:title"] = title
	$: metatags["twitter:description"] = summary
</script>

<div id="content">
    <p>Olen pitkään ollut kiinnostunut kuolemasta. Mietin paljon miten nopeasti aika kuluu ja mitä olen elämässäni saavuttanut.</p>
    <p>On pelottava ajatus, että tämä mahtava koneisto jota kehoksi kutsutaan, voidaan sulkea ja unohtaa kuin vanha tietokone. Mitä enemmän mietin tuota, sitä enemmän halusin tutustua kuolemaan tieteellisesti, henkisesti ja uskonnollisesti. Voiko tiede tarjota meille lisää vuosia tai herättää aivokuolleita? Onko meillä toivoa iankaikkisesta elämästä tai uudelleensyntymisestä? Uskonnot tarjoavat kauniita ajatuksia, mutta onko niissä yhtään todellisuutta? Onko kenelläkään vastausta kysymyksiin kuoleman jälkeisestä? Uskon, että tiede voi pidentää elämäämme tulevaisuudessa, mutta kerkeääkö se pelastaa minun elämääni?</p>
</div>

<div id="content">
	<ul id="posts" class="noUnd">
		{#each posts as {meta, path}}
			<li class="block">
				<a class="article grid block" href={$url(path)} title={meta.frontmatter.title} hreflang={meta.frontmatter.language}>
					<h2 class="small darkBlue">{meta.frontmatter.title}</h2>
					<p class="desc">{meta.frontmatter.summary}</p>
				</a>
			</li>
		{/each}
	</ul>
</div>