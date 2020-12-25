<script>
	import { metatags } from "@sveltech/routify";
	export let title, summary
	$: metatags.title = title
	$: metatags.author = "Timo Anttila <moro@tuspe.com>"
	$: metatags.description = summary
	$: metatags["twitter:title"] = title
	$: metatags["twitter:description"] = summary
</script>

<article itemscope itemtype="http://schema.org/NewsArticle">

	<div id="about" class="bgw pad">
		<div class="container mxa">
			<h1 id="title" itemprop="headline">{title}</h1>
			<p class="summary mxa" itemprop="description">{summary}</p>
		</div>
	</div>
			
	<div id="content" class="bgb pad" itemprop="articleBody"><div class="container mxa"><slot/></div></div>

</article>