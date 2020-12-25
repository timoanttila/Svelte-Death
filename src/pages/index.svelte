<script>
	import { url, layout, metatags } from "@sveltech/routify";
	const posts = $layout.parent.children
		.filter((c) => c.meta["frontmatter"])
		.sort((a, b) => b.meta["frontmatter"].published.localeCompare(a.meta["frontmatter"].published));
	let title = "Tutorials"
	let summary = "A collection of tutorials about things I've learned or discovered. Most of the tutorials are easy to read and to learn."
	$: metatags.title = title
	$: metatags.description = summary
	$: metatags["twitter:title"] = title
	$: metatags["twitter:description"] = summary
</script>

<section id="about" class="bgw pad noUnd">
	<div class="container content mxa tc">
		<h1>{title}</h1>
		<p class="summary mxa">{summary}</p>
	</div>
</section>

<div id="content" class="bgb pad">
	<ul id="posts" class="container mxa grid block noUnd">
		{#each posts as {meta, path}}
			<li class="mxa">
				<div class="content grid">
					<aside class="grid tc">
						<div class="pub bor">
							<div class="grid cell">
								<div class="day">{meta.frontmatter.pub[0]}</div>
								<div class="month">{meta.frontmatter.pub[1]}</div>
							</div>
						</div>
					</aside>
					<a class="article grid" href={$url(path)} title={meta.frontmatter.title}>
						<div class="content">
							<h2 class="bold">{meta.frontmatter.title}</h2>
							<p class="summary">{meta.frontmatter.summary}</p>
						</div>
					</a>
				</div>
			</li>
		{/each}
	</ul>
</div>
