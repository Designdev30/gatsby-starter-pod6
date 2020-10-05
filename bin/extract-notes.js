//#!/usr/bin/env node
/**
 * 
 * DESCRIPTION:  Extract notes for publish from any pod6 and :type(spec) files
 *      AUTHOR:  Alex Zahatski ,  <zag@cpan.org>
* 
 */

const fs = require('fs')
const program = require('commander');
const log = (a) => JSON.stringify(a,null,2)

program
    .requiredOption('-f, --file <filename>', 'file extract notes from')
    .option('-d, --dir <path>', 'Set output directory')
    .parse(process.argv)


const toAny = require('pod6/src/exportAny')
const {makeAttrs} = require('pod6/src/helpers/config')
const {parse} = require('pod6')
let filename =  program.file
console.log(`Start processing ${filename}`)

let src = fs.readFileSync(filename, 'utf-8');

const { toHtml }  = require('pod6');
const { push } = require('gatsby');
const handlersTree = {}
let notes = []
// pass only for block with pubdate config

const getNotes = ( opt ) => toAny().use(
    '*', ( writer, processor ) => ( node, ctx, interator ) => {
         const config = makeAttrs(node, ctx);
         if ( node.name === 'pod' ) {
             // for =pod do recursive search
             interator(node.content, ctx)
             return 
         }
        if ( !node.level  // skip headers
                &&
            node.name !== 'pod'   // skip =pod block
                && 
              config.exists('pubdate')) {
            const note =`=begin pod :type('note') :pubdate('${config.getFirstValue('pubdate')}')
=begin DESCRIPTION
${node.text}
=end DESCRIPTION

${node.text}
=end pod` 
            notes.push(note)
        }
})

/**
 * Process embeded articles from documents
 * Collect blocks between =head with pubdate config
 * and =head with the same level
 
 For example
 =for head2  :pubdate('2021-11-31Z10:00:00) :tags<pod6> 
 Article
 =para test
 =para second test
 =head3 sub header
 =para test 1
 =head2
 
 Article will contains:
 
 =begin pod :pubdate('2021-11-31Z10:00:00) :tags<pod6> :type('post')
 =TITLE Article
 
 =begin DESCRIPTION
 =para test
 =end DESCRIPION
 
 =para test
 =para second test
 =head3 sub header
 =para test 1
 =end pod


 =end pod

 
 */
let articles = []

const getArticles = (array) => {
    // console.log(array)
    // collect alias 
    const aliases  = array.filter(i=>i.type=='alias')
    // at first collect all levels
    // console.log(array)
    const levels = array.filter( node => node.level && node.name === 'head' ) || []
    const pubdate = levels.filter( node => {
         return makeAttrs(node,{}).exists('pubdate')
      } )
    if (pubdate.length > 0 ) {
        const nodePublished = pubdate[0]
        // get next header with same level
        const nextHeader = levels
                            .slice( levels.indexOf(nodePublished) +1 ) // ignore this and previous nodes
                            .filter( node => node.level <= nodePublished.level) // stop then found the same or lower level
                            .shift() 

        let lastIndexOfArticleNode = !nextHeader ? array.length
                                                 : array.indexOf(nextHeader)
        const articleContent = array.slice(array.indexOf(nodePublished)+1,lastIndexOfArticleNode)
        if (articleContent.length) {
            let pod6content = []
            let Description = ''
            toAny().use({
                '*': ( writer, processor ) => ( node, ctx, interator ) => {
                    console.error(log(node))
                }

            })
            .use({
                ':blankline':( writer, processor ) => ( node, ctx, interator ) => {
                             pod6content.push("\n");
                },
                'code:block':( writer, processor ) => ( node, ctx, interator ) => {
                    let attrs =''
                    if (node.config && node.config.length) {
                        const attr = makeAttrs(node, ctx)
                         Object.keys(attr.asHash()).map( name => {
                             attrs += ` :${name}[${attr.getAllValues(name).join('')}]`
                         })
                    }
                    pod6content.push(`=begin code ${attrs}\n`)
                    interator(node.content, ctx)
                    pod6content.push("=end code\n")
                }, 
                ':text':( writer, processor ) => ( node, ctx, interator ) => {
                    pod6content.push(`${node.value}`);
                },
                ':verbatim':( writer, processor ) => ( node, ctx, interator ) => {
                    pod6content.push(`${node.value}`);
                },
                'B<>': ( writer, processor ) => ( node, ctx, interator ) => {
                    pod6content.push("B<")
                    interator(node.content, ctx)
                    pod6content.push(">")
                },
                'head:block': ()=>(node, ctx, interator)=>{
                        const level = nodePublished.level > 1 ? 1+ (node.level - nodePublished.level ): nodePublished.level
                        pod6content.push(`=head${level}\n`)
                        interator(node.content, ctx)
                },
                ':para': ()=>(node, ctx, interator)=>{
                    // save first para as DECRIPTION
                    if (!Description) Description = node.text
                    pod6content.push(node.text)
                },
                'para:block': ()=>(node, ctx, interator)=>{
                    pod6content.push("=begin para\n")
                    interator(node.content, ctx)
                    pod6content.push("=end para\n")
                },
                ':list':()=>(node, ctx, interator)=>{
                    interator(node.content, ctx)
                },
                'item:block':()=>(node, ctx, interator)=>{
                    pod6content.push(`=begin item${node.level}\n`)
                    interator(node.content, ctx)
                    pod6content.push(`=end item${node.level}\n`)
                },
                'TODOS:block':()=>(node, ctx, interator)=>{
                    pod6content.push(`=begin ${node.name}\n`)
                    interator(node.content, ctx)
                    pod6content.push(`=end ${node.name}\n`)
                },
                ':alias':()=>(node, ctx, interator)=>{
                    pod6content.push(`=alias ${node.name} `)
                    interator(node.replacement, ctx)
                },                
            })
            .run([...aliases, ...articleContent]);
            
            const article =`=begin pod :type('post') :pubdate('${makeAttrs(nodePublished,{}).getFirstValue('pubdate')}')
=TITLE ${nodePublished.content[0].text}
=begin DESCRIPTION
${Description}
=end DESCRIPTION
${pod6content.join('')}
=end pod`;
            articles.push(article)
        }
    }
    array.forEach( node => { if (Array.isArray(node.content) ) {
        getArticles(node.content)
        }
    })
};

getArticles(parse(src))
getNotes().run(src)

const path = require('path')
// prepare file.template 
const { dir , ext, name } = path.parse(path.normalize(program.file))
const filenamePrefix = dir.replace(/\//g, '-')
console.log(`Found notes: ${notes.length}, articles: ${articles.length}`)

// now store articles and notes into files

for (let i =0; i < notes.length;i++) {
    const fileName = `${filenamePrefix}-${name}.n${i+1}${ext}`
    const outputFileName  = path.join(program.dir || dir, fileName)
    console.log(`Writing ${outputFileName}`)
    fs.writeFileSync( outputFileName , notes[i], 'utf8')
}

for (let i =0; i < articles.length;i++) {
    const fileName = `${filenamePrefix}-${name}.p${i+1}${ext}`
    const outputFileName  = path.join(program.dir || dir, fileName)
    console.log(`Writing ${outputFileName}`)
    fs.writeFileSync( outputFileName , articles[i], 'utf8')
}
