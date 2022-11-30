import { Plugin, MarkdownPostProcessorContext} from 'obsidian';

export default class TTRPGtoolsPlugin extends Plugin {

	async onload() {
		console.log('loading TTRPG Helper Tools')
		this.registerMarkdownPostProcessor(this.statCalc.bind(this))
		this.registerMarkdownPostProcessor(this.glossary.bind(this))
	}

	onunload() {
		console.log('unloading TTRPG Helper Tools')
	}

	async statCalc(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		interface options {
			separator?: string
			style?: "inline" | "tooltip" 
			position?: "top" | "bottom" | "right" | "left"
		}
		if (typeof(ctx.frontmatter) == "undefined") return
		if (typeof(ctx.frontmatter.statcalc) == "undefined") return

		const frontmatterPre = ctx.frontmatter.statcalc
		const frontmatter: options = {}
		for (let i = 0; i < frontmatterPre.length; i++) {
			Object.assign(frontmatter, frontmatterPre[i])
		} 
		const separator = frontmatter.separator || " | "
		const tooltipPostion = frontmatter.position || "top"
		const style = frontmatter.style || "inline"
		
		const nodeList = el.querySelectorAll("p, h1, h2, h3, h4, h5, h6, th, td, li, ul, ol")
		if (!nodeList.length) return
		nodeList.forEach(node => {
			const text = node.innerHTML

			if (text?.match(/{[0-9]*}/g)) {
				node.innerHTML = text.replace(/{[0-9]*}/g, function (x) {
					const statInt = parseInt(x.replace(/\{|\}/g, ''))
					if (style == "inline") {
						return `${statInt}<span class="ttrpgtools-inline">${separator}${Math.floor(statInt / 2)}${separator}${Math.floor(statInt / 5)}</span>`
					} else if (style == "tooltip") {
						return `<span class="ttrpgtools-hover" aria-label="${Math.floor(statInt / 2)}${separator}${Math.floor(statInt / 5)}" aria-label-position="${tooltipPostion}">${statInt}</span>`
					} else return `${statInt}`
				})
			}

		})
	}

	async glossary(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		interface glos {
			[index: string]: string;
		}
		if (typeof(ctx.frontmatter) == "undefined") return
		if (typeof(ctx.frontmatter.glossary) == "undefined") return
		
		const frontmatterPre = ctx.frontmatter.glossary
		const gloss = frontmatterPre
		
		const files = this.app.vault.getMarkdownFiles()
		const glossFile = files.find(file => {
			if (file.basename == gloss) {
				return file
			}
		})
		if (!glossFile) return
		const glossaryText = await this.app.vault.cachedRead(glossFile)
		const glossary: glos = JSON.parse(glossaryText)
		for (const [key, value] of Object.entries(glossary)) {
			if (value.match("glossary.")) {
				const pp = value.replace("glossary.", "")
				if (glossary[pp]) {
					glossary[key] = glossary[pp]
				}				
			}
		}

		const nodeList = el.querySelectorAll("p, h1, h2, h3, h4, h5, h6, th, td, li, ul, ol")
		if (!nodeList.length) return
		nodeList.forEach(node => {
			const text = node.innerHTML
			for (const [key, value] of Object.entries(glossary)) {
				const regex = new RegExp(`\\b${key}\\b`, "gm")
				if (text?.match(regex)) {
					node.innerHTML = text.replace(regex, `<span class="ttrpgtools-glossary" aria-label="${value}" aria-label-position="top">${key}</span>`)
				}
			}
		})
		
	}
}
